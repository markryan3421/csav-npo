<?php

namespace App\Http\Controllers;

use App\Http\Requests\GoalRequest;
use App\Models\Goal;
use App\Models\Sdg;
use App\Models\User;
use App\Services\GoalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GoalController extends Controller
{
    public function __construct(
        protected GoalService $goalService
    ) {}

    /**
     * GET /{sdg}/goals
     * List all goals for the given SDG that the auth user owns or is assigned to.
     */
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // current_sdg_id is updated by changeSdg() — this is now the source of truth
        $currentSdg = $user->currentSdg; // uses the relationship on User model

        if (!$currentSdg) {
            // User hasn't selected an SDG yet — send them to the dashboard
            return redirect()->route('dashboard');
        }

        $goals = Goal::withoutGlobalScope('sdg')
            ->where('sdg_id', $currentSdg->id)
            ->where(function ($q) use ($user) {
                $q->where('project_manager_id', $user->id)
                    ->orWhereHas('assignedUsers', fn($q) => $q->where('users.id', $user->id));
            })
            ->with(['assignedUsers:id,name,email', 'projectManager:id,name'])
            ->get();

        $totalGoals        = Goal::withoutGlobalScope('sdg')->where('sdg_id', $currentSdg->id)->count();
        $compliantGoals    = Goal::withoutGlobalScope('sdg')->where('sdg_id', $currentSdg->id)->where('compliance_percentage', 100)->count();
        $nonCompliantGoals = Goal::withoutGlobalScope('sdg')->where('sdg_id', $currentSdg->id)->where('compliance_percentage', '<', 100)->count();
        $assignedGoalsCount = $user->goals->count();

        return Inertia::render('goals/index', [
            'selectedSdg'       => $currentSdg,
            'goals'             => $goals,
            'totalGoals'        => $totalGoals,
            'compliantGoals'    => $compliantGoals,
            'nonCompliantGoals' => $nonCompliantGoals,
            'assignedGoalsCount' => $assignedGoalsCount,
        ]);
    }
    /**
     * GET /{sdg}/goals/create
     * Show the create form. Staff list = users in this SDG excluding the creator.
     */
    public function create()
    {
        /** @var \App\Models\User $user */
        $authUser = Auth::user();
        $sdg = $authUser->currentSdg;

        // Users belonging to the same SDG via sdg_user pivot, excluding the creator
        $staffUsers = User::where('current_sdg_id', '=', $sdg->id)
            ->where('id', '!=', $authUser->id) // Exclude the current user
            ->get();

        return Inertia::render('goals/create', [
            'sdg'        => $sdg,
            'authUser'   => $authUser,
            'staffUsers' => $staffUsers,
        ]);
    }

    /**
     * POST /{sdg}/goals
     */
    public function store(GoalRequest $request)
    {
        $sdg = Auth::user()->currentSdg;

        if (!$sdg) return redirect()->route('dashboard');

        $data = array_merge($request->validated(), ['sdg_id' => $sdg->id]);

        $this->goalService->createGoal($data, Auth::id());

        return redirect()->route('goals.index')
            ->with('success', 'Goal created successfully.');
    }

    public function show(Goal $goal)
    {
        $user = Auth::user();
        $userRole = $user->getRoleNames()->first() ?? 'staff';

        $goal->load([
            'projectManager:id,name,avatar',
            'assignedUsers:id,name,email,avatar',
            'sdg:id,name',
            'tasks.taskProductivities.user',
            'tasks.taskProductivities.taskProductivityFiles',
        ]);
        // dd($goal->toArray());

        return Inertia::render('goals/show', [
            'goal'         => $goal,
            'authUserRole' => $userRole,
            'authUserId'   => $user->id,
        ]);
    }

    /**
     * GET /{sdg}/goals/{goal}/edit
     */
    public function edit(Goal $goal)
    {
        $authUser = Auth::user();
        $sdg = $authUser->currentSdg;

        if (!$sdg || $goal->sdg_id !== $sdg->id) abort(404);

        $staffUsers = User::where('current_sdg_id', $authUser->current_sdg_id)
            ->where('id', '!=', $authUser->id)
            ->get();

        $goal->load('assignedUsers:id');
        $assignedUserIds = $goal->assignedUsers->pluck('id')->toArray();

        return Inertia::render('goals/edit', compact('sdg', 'goal', 'assignedUserIds', 'authUser', 'staffUsers'));
    }

    /**
     * PUT /{sdg}/goals/{goal}
     */
    public function update(GoalRequest $request, Goal $goal)
    {
        $sdg = Auth::user()->currentSdg;

        if (!$sdg || $goal->sdg_id !== $sdg->id) abort(404);

        $this->goalService->updateGoal($goal, $request->validated());

        return redirect()->route('goals.index')
            ->with('success', 'Goal updated successfully.');
    }

    /**
     * DELETE /{sdg}/goals/{goal}
     */
    public function destroy(Goal $goal)
    {
        $goal->delete();

        return redirect()
            ->route('goals.index')
            ->with('success', 'Goal deleted successfully.');
    }
}
