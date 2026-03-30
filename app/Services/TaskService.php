<?php

namespace App\Services;

use App\Events\TaskNotification;
use App\Models\Goal;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TaskService
{
    /**
     * Create a new task under the given goal and notify all assigned staff.
     */
    public function createTask(array $data, Goal $goal): Task
    {
        $task = $goal->tasks()->create([
            'goal_id'     => $goal->id,
            'sdg_id'      => $goal->sdg_id,
            'slug'        => Str::slug($data['title']),
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'status'      => 'pending',
            'deadline'    => $data['deadline'],
        ]);

        $this->notifyAssignedUsers($task, $goal, 'task_created');

        return $task;
    }

    /**
     * Update an existing task and notify all assigned staff.
     */
    public function updateTask(array $data, Goal $goal, Task $task): Task
    {
        $task->update([
            'goal_id'     => $goal->id,
            'sdg_id'      => $goal->sdg_id,
            'title'       => $data['title'],
            'slug'        => Str::slug($data['title']),
            'description' => $data['description'],
            'deadline'    => $data['deadline'],
        ]);

        $this->notifyAssignedUsers($task, $goal, 'task_updated');

        return $task;
    }

    /**
     * Broadcast a TaskNotification to every assigned user on the goal,
     * skipping the user who triggered the action.
     */
    private function notifyAssignedUsers(Task $task, Goal $goal, string $type): void
    {
        /** @var User $triggeredBy */
        $triggeredBy    = Auth::user();
        $assignedUsers  = $goal->assignedUsers;
        $broadcastedIds = [];

        foreach ($assignedUsers as $assignedUser) {
            // Skip the creator/updater and prevent duplicate broadcasts
            if ($assignedUser->id === $triggeredBy->id) {
                continue;
            }

            if (in_array($assignedUser->id, $broadcastedIds)) {
                continue;
            }

            try {
                broadcast(new TaskNotification($task, $goal, $assignedUser, $triggeredBy, $type));
                $broadcastedIds[] = $assignedUser->id;

                Log::info("TaskNotification [{$type}] broadcasted to user {$assignedUser->id} for task {$task->id}");
            } catch (\Exception $e) {
                Log::error("Failed to broadcast TaskNotification to user {$assignedUser->id}: " . $e->getMessage());
            }
        }
    }
}