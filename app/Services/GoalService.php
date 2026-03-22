<?php

namespace App\Services;

use App\Models\Goal;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class GoalService
{
    /**
     * Create a new Goal and attach assigned staff to the pivot.
     */
    public function createGoal(array $data, int $creatorId): Goal
    {
        $goal = Goal::create([
            'project_manager_id' => $creatorId,
            'sdg_id'             => $data['sdg_id'],
            'title'              => $data['title'],
            'slug'               => Str::slug($data['title']),
            'description'        => $data['description'],
            'type'               => $data['type'],
            'start_date'         => $data['start_date'],
            'end_date'           => $data['end_date'],
            'status'             => 'pending',
        ]);

        // Only attach staff assigned to this goal — NOT the creator.
        // The creator is already tracked via project_manager_id.
        if (!empty($data['assigned_users'])) {
            $goal->assignedUsers()->sync($data['assigned_users']);
        }

        return $goal;
    }

    /**
     * Update an existing Goal and re-sync assigned users.
     */
    public function updateGoal(Goal $goal, array $data): Goal
    {
        $goal->update([
            'title'       => $data['title'],
            'slug'        => Str::slug($data['title']),
            'description' => $data['description'],
            'type'        => $data['type'],
            'start_date'  => $data['start_date'],
            'end_date'    => $data['end_date'],
        ]);

        // sync() removes old assignments and adds new ones in one query
        $goal->assignedUsers()->sync($data['assigned_users'] ?? []);

        return $goal;
    }
}
