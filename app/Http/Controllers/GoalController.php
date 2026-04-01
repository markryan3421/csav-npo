<?php

namespace App\Http\Controllers;

use App\Concerns\HasPaginatedIndex;
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
    use HasPaginatedIndex;

    public function __construct(
        protected GoalService $goalService
    ) {}

    /**
     * GET /goals
     *
     * Visibility rules:
     *   A goal is visible to the logged-in user if EITHER:
     *     (a) They are the project manager AND the goal is linked to their current SDG
     *         via the pivot table.
     *     (b) They are explicitly assigned to the goal via goal_user pivot —
     *         regardless of which SDG the goal belongs to, because cross-SDG
     *         assignment is intentional.
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $currentSdg = $user->currentSdg;

        if (!$currentSdg) {
            return redirect()->route('dashboard');
        }

        // No need for withoutGlobalScope since we removed it
        $goals = Goal::where(function ($q) use ($user, $currentSdg) {
                $q->where('project_manager_id', $user->id)
                ->whereHas('goalWithSdgs', fn ($q) =>
                    $q->where('sdg_id', $currentSdg->id)
                );
            })
            ->orWhere(function ($q) use ($user) {
                $q->whereHas('assignedUsers', fn ($q) =>
                    $q->where('user_id', $user->id)
                );
            })
            ->with([
                'assignedUsers:id,name,email',
                'projectManager:id,name',
                'goalWithSdgs:id,name',
            ])
            ->get();

        // Stats — scoped to the user's current SDG only (for the dashboard counts)
        $totalGoals = Goal::whereHas('goalWithSdgs', fn ($q) =>
            $q->where('sdg_id', $currentSdg->id)
        )->count();

        $compliantGoals = Goal::whereHas('goalWithSdgs', fn ($q) =>
                $q->where('sdg_id', $currentSdg->id)
            )
            ->where('compliance_percentage', 100)
            ->count();

        $nonCompliantGoals = Goal::whereHas('goalWithSdgs', fn ($q) =>
                $q->where('sdg_id', $currentSdg->id)
            )
            ->where('compliance_percentage', '<', 100)
            ->count();

        // Count all goals assigned to this user across all SDGs
        $assignedGoalsCount = Goal::whereHas('assignedUsers', fn ($q) =>
            $q->where('user_id', $user->id)
        )->count();

        $result = $this->paginateCollection(
            items: collect($goals), // wrap in Collection if not already
            request: $request,
            searchColumns: ['title', 'description'], // adjust to Goal columns
        );

        return Inertia::render('goals/index', [
            'goals'      => [
                'data' => $result['data'],
                'links' => $result['pagination']['links'] ?? [],
                'from' => $result['pagination']['from'] ?? 0,
                'to' => $result['pagination']['to'] ?? 0,
                'total' => $result['totalCount'],
            ],
            'filters'       => $result['filters'],
            'totalCount'    => $result['totalCount'],
            'filteredCount' => $result['filteredCount'],
            
            'selectedSdg'        => $currentSdg,
            'totalGoals'         => $totalGoals,
            'compliantGoals'     => $compliantGoals,
            'nonCompliantGoals'  => $nonCompliantGoals,
            'assignedGoalsCount' => $assignedGoalsCount,
        ]);
    }

    /**
     * GET /goals/create
     */
    public function create()
    {
        /** @var \App\Models\User $user */
        $authUser = Auth::user();

        $allSdgs = Sdg::all();

        $usersBySdg = [];
        $allUsers = User::where('id', '!=', $authUser->id)
            ->with('currentSdg')
            ->get();

        foreach ($allUsers as $user) {
            if ($user->current_sdg_id) {
                $usersBySdg[$user->current_sdg_id][] = $user;
            }
        }

        $staffUsers = User::where('current_sdg_id', $authUser->current_sdg_id)
            ->where('id', '!=', $authUser->id)
            ->get();

        return Inertia::render('goals/create', [
            'sdg'        => $authUser->currentSdg,
            'authUser'   => $authUser,
            'staffUsers' => $staffUsers,
            'allSdgs'    => $allSdgs,
            'usersBySdg' => $usersBySdg,
        ]);
    }

    /**
     * POST /goals
     */
    public function store(GoalRequest $request)
    {
        $sdg = Auth::user()->currentSdg;

        if (!$sdg) return redirect()->route('dashboard');

        $sdgIds = $request->input('sdg_ids', []);

        if (empty($sdgIds)) {
            return redirect()->back()->withErrors(['sdg_ids' => 'Please select at least one SDG.']);
        }

        $data = $request->validated();
        $data['sdg_id'] = $sdgIds[0];

        $goal = $this->goalService->createGoal($data, Auth::id());
        $goal->goalWithSdgs()->sync($sdgIds);

        return redirect()->route('goals.index')
            ->with('success', 'Goal created successfully.');
    }

    /**
     * GET /goals/{goal}
     *
     * FIX: Load assignedUsers FIRST so ->contains() works correctly.
     * Then check access: user may view if they are the project manager,
     * an assigned user, OR the goal is linked to their current SDG.
     */
    public function show(Goal $goal)
    {
        $user = Auth::user();
        $userRole = $user->getRoleNames()->first() ?? 'staff';

        // Load everything first — including assignedUsers —
        // so ->contains() below works on the loaded collection, not an empty one.
        $goal->load([
            'projectManager:id,name,avatar',
            'assignedUsers:id,name,email,avatar',
            'goalWithSdgs:id,name',
            'tasks.taskProductivities.user',
            'tasks.taskProductivities.taskProductivityFiles',
        ]);

        // Access is granted if ANY of these is true:
        $isProjectManager  = $goal->project_manager_id === $user->id;
        $isAssigned        = $goal->assignedUsers->contains('id', $user->id);
        $isLinkedToUserSdg = $goal->goalWithSdgs->contains('id', $user->current_sdg_id);

        if (!$isProjectManager && !$isAssigned && !$isLinkedToUserSdg) {
            abort(403, 'You do not have access to this goal.');
        }

        return Inertia::render('goals/show', [
            'goal'         => $goal,
            'authUserRole' => $userRole,
            'authUserId'   => $user->id,
        ]);
    }

    /**
     * GET /goals/{goal}/edit
     *
     * FIX: An assigned user or project manager can edit,
     * not just someone whose current SDG matches.
     */
    public function edit(Goal $goal)
    {
        $authUser = Auth::user();
        $sdg = $authUser->currentSdg;

        $goal->load('assignedUsers:id', 'goalWithSdgs:id');

        $isProjectManager  = $goal->project_manager_id === $authUser->id;
        $isAssigned        = $goal->assignedUsers->contains('id', $authUser->id);
        $isLinkedToUserSdg = $goal->goalWithSdgs->contains('id', $authUser->current_sdg_id);

        if (!$isProjectManager && !$isAssigned && !$isLinkedToUserSdg) {
            abort(403, 'You do not have access to edit this goal.');
        }

        $allSdgs = Sdg::all();

        $usersBySdg = [];
        $allUsers = User::where('id', '!=', $authUser->id)
            ->with('currentSdg')
            ->get();

        foreach ($allUsers as $user) {
            if ($user->current_sdg_id) {
                $usersBySdg[$user->current_sdg_id][] = $user;
            }
        }

        $assignedUserIds   = $goal->assignedUsers->pluck('id')->toArray();
        $associatedSdgIds  = $goal->goalWithSdgs->pluck('id')->toArray();

        return Inertia::render('goals/edit', [
            'sdg'              => $sdg,
            'goal'             => $goal,
            'allSdgs'          => $allSdgs,
            'associatedSdgIds' => $associatedSdgIds,
            'assignedUserIds'  => $assignedUserIds,
            'authUser'         => $authUser,
            'usersBySdg'       => $usersBySdg,
        ]);
    }

    /**
     * PUT /goals/{goal}
     */
    public function update(GoalRequest $request, Goal $goal)
    {
        $authUser = Auth::user();

        $goal->load('goalWithSdgs:id', 'assignedUsers:id');

        $isProjectManager  = $goal->project_manager_id === $authUser->id;
        $isAssigned        = $goal->assignedUsers->contains('id', $authUser->id);
        $isLinkedToUserSdg = $goal->goalWithSdgs->contains('id', $authUser->current_sdg_id);

        if (!$isProjectManager && !$isAssigned && !$isLinkedToUserSdg) {
            abort(403, 'You do not have access to update this goal.');
        }

        $sdgIds = $request->input('sdg_ids', []);

        if (empty($sdgIds)) {
            return redirect()->back()->withErrors(['sdg_ids' => 'Please select at least one SDG.']);
        }

        $data = $request->validated();
        $data['sdg_id'] = $sdgIds[0];

        $this->goalService->updateGoal($goal, $data);
        $goal->goalWithSdgs()->sync($sdgIds);

        return redirect()->route('goals.index')
            ->with('success', 'Goal updated successfully.');
    }

    /**
     * DELETE /goals/{goal}
     *
     * Only the project manager can delete.
     */
    public function destroy(Goal $goal)
    {
        $user = Auth::user();

        // Only the project manager should be able to delete a goal
        if ($goal->project_manager_id !== $user->id) {
            abort(403, 'Only the project manager can delete this goal.');
        }

        $goal->goalWithSdgs()->detach();
        $goal->delete();

        return redirect()
            ->route('goals.index')
            ->with('success', 'Goal deleted successfully.');
    }
}