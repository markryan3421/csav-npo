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
     *   - super-admin & Admin: see ALL goals (no restrictions)
     *   - project-manager: see all goals under their current SDG (regardless of creator)
     *   - Staff: see only goals they are assigned to OR goals under their current SDG
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $userRole = $user->getRoleNames()->first() ?? 'staff';

        $currentSdg = $user->currentSdg;

        if (!$currentSdg) {
            return redirect()->route('dashboard');
        }

        // Build query based on user role
        $goalsQuery = Goal::query();

        if ($userRole === 'super-admin' || $userRole === 'admin') {
            // super-admin & Admin: see ALL goals
            $goalsQuery = Goal::query();
        } elseif ($userRole === 'project-manager') {
            // project-manager: see all goals under their current SDG
            $goalsQuery = Goal::whereHas('goalWithSdgs', fn ($q) =>
                $q->where('sdg_id', $currentSdg->id)
            );
        } else {
            // Staff: see goals they are assigned to OR goals under their current SDG
            $goalsQuery = Goal::where(function ($q) use ($user, $currentSdg) {
                $q->whereHas('assignedUsers', fn ($q) =>
                    $q->where('user_id', $user->id)
                )->orWhereHas('goalWithSdgs', fn ($q) =>
                    $q->where('sdg_id', $currentSdg->id)
                );
            });
        }

        $goals = $goalsQuery
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
            items: collect($goals),
            request: $request,
            searchColumns: ['title', 'description'],
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
        
        // Get only STAFF users (exclude super-admin, admin, and project-manager)
        $staffUsers = User::where('current_sdg_id', $authUser->current_sdg_id)
            ->where('id', '!=', $authUser->id)
            ->whereDoesntHave('roles', function ($query) {
                $query->whereIn('name', ['super-admin', 'admin', 'project-manager']);
            })
            ->get();

        // Build usersBySdg for cross-SDG assignment - also only staff users
        $allUsers = User::where('id', '!=', $authUser->id)
            ->whereDoesntHave('roles', function ($query) {
                $query->whereIn('name', ['super-admin', 'admin', 'project-manager']);
            })
            ->with('currentSdg')
            ->get();

        foreach ($allUsers as $user) {
            if ($user->current_sdg_id) {
                $usersBySdg[$user->current_sdg_id][] = $user;
            }
        }

        return Inertia::render('goals/create', [
            'sdg'        => $authUser->currentSdg,
            'authUser'   => $authUser,
            'staffUsers' => $staffUsers,
            'allSdgs'    => $allSdgs,
            'usersBySdg' => $usersBySdg,
        ]);
    }

    /**
     * GET /goals/{goal}/edit
     */
    public function edit(Goal $goal)
    {
        $authUser = Auth::user();
        $sdg = $authUser->currentSdg;
        $userRole = $authUser->getRoleNames()->first() ?? 'staff';

        $goal->load('assignedUsers:id', 'goalWithSdgs:id');

        // Access control for editing
        $isProjectManager  = $goal->project_manager_id === $authUser->id;
        $isAssigned        = $goal->assignedUsers->contains('id', $authUser->id);
        $isLinkedToUserSdg = $goal->goalWithSdgs->contains('id', $authUser->current_sdg_id);
        $isAdminOrSuperAdmin = in_array($userRole, ['super-admin', 'admin']);

        if (!$isAdminOrSuperAdmin && !$isProjectManager && !$isAssigned && !$isLinkedToUserSdg) {
            abort(403, 'You do not have access to edit this goal.');
        }

        $allSdgs = Sdg::all();

        // Get only STAFF users for assignment (exclude super-admin, admin, project-manager)
        $usersBySdg = [];
        $allUsers = User::where('id', '!=', $authUser->id)
            ->whereDoesntHave('roles', function ($query) {
                $query->whereIn('name', ['super-admin', 'admin', 'project-manager']);
            })
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
     */
    public function show(Goal $goal)
    {
        $user = Auth::user();
        $userRole = $user->getRoleNames()->first() ?? 'staff';

        // First, load the goal with its assigned users
        $goal->load([
            'projectManager:id,name,avatar',
            'assignedUsers:id,name,email,avatar',
            'tasks.taskProductivities.user',
            'tasks.taskProductivities.taskProductivityFiles',
        ]);

        // Load SDGs and filter their users to only those assigned to this goal
        $goal->load(['goalWithSdgs' => function ($query) use ($goal) {
            $query->select('sdgs.id', 'sdgs.name', 'sdgs.description', 'sdgs.slug')
                ->with(['users' => function ($q) use ($goal) {
                    // Only load users that are assigned to this specific goal
                    $q->whereIn('users.id', $goal->assignedUsers->pluck('id'))
                        ->select('users.id', 'users.name', 'users.email', 'users.avatar');
                }]);
        }]);

        $isAdminOrSuperAdmin = in_array($userRole, ['super-admin', 'admin']);
        $isProjectManager    = $goal->project_manager_id === $user->id;
        $isAssigned          = $goal->assignedUsers->contains('id', $user->id);
        $isLinkedToUserSdg   = $goal->goalWithSdgs->contains('id', $user->current_sdg_id);

        if (!$isAdminOrSuperAdmin && !$isProjectManager && !$isAssigned && !$isLinkedToUserSdg) {
            abort(403, 'You do not have access to this goal.');
        }

        return Inertia::render('goals/show', [
            'goal'         => $goal,
            'authUserRole' => $userRole,
            'authUserId'   => $user->id,
        ]);
    }

    /**
     * PUT /goals/{goal}
     */
    public function update(GoalRequest $request, Goal $goal)
    {
        $authUser = Auth::user();
        $userRole = $authUser->getRoleNames()->first() ?? 'staff';

        $goal->load('goalWithSdgs:id', 'assignedUsers:id');

        $isAdminOrSuperAdmin = in_array($userRole, ['super-admin', 'admin']);
        $isProjectManager    = $goal->project_manager_id === $authUser->id;
        $isAssigned          = $goal->assignedUsers->contains('id', $authUser->id);
        $isLinkedToUserSdg   = $goal->goalWithSdgs->contains('id', $authUser->current_sdg_id);

        if (!$isAdminOrSuperAdmin && !$isProjectManager && !$isAssigned && !$isLinkedToUserSdg) {
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
     */
    public function destroy(Goal $goal)
    {
        $user = Auth::user();
        $userRole = $user->getRoleNames()->first() ?? 'staff';
        
        // Admin, super-admin, or the project-manager can delete
        $isAdminOrSuperAdmin = in_array($userRole, ['super-admin', 'admin']);
        $isProjectManager = $goal->project_manager_id === $user->id;

        if (!$isAdminOrSuperAdmin && !$isProjectManager) {
            abort(403, 'Only administrators or the project-manager can delete this goal.');
        }

        $goal->goalWithSdgs()->detach();
        $goal->delete();

        return redirect()
            ->route('goals.index')
            ->with('success', 'Goal deleted successfully.');
    }
}