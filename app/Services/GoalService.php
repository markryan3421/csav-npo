<?php

namespace App\Services;

use App\Models\Goal;
use App\Events\GoalAssignedNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoalService
{
    /**
     * Create a new Goal and attach assigned staff to the pivot.
     */
    public function createGoal(array $data, int $creatorId): Goal
    {
        Log::info('Creating goal with data:', $data);
        
        $goal = Goal::create([
            'project_manager_id' => $creatorId,
            'sdg_id' => $data['sdg_id'],
            'title' => $data['title'],
            'slug' => Str::slug($data['title']),
            'description' => $data['description'],
            'type' => $data['type'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'status' => 'pending',
        ]);

        // Refresh the model to ensure we have the latest data
        $goal->refresh();
        
        $creator = Auth::user();
        Log::info('Goal created. Creator:', ['id' => $creator->id, 'name' => $creator->name]);
        
        // Attach staff assigned to this goal
        if (!empty($data['assigned_users'])) {
            Log::info('Assigning users:', $data['assigned_users']);
            $goal->assignedUsers()->sync($data['assigned_users']);
            
            // Use a unique key to prevent duplicate broadcasts
            $broadcastedUsers = [];
            
            // Dispatch notifications for each assigned user
            foreach ($data['assigned_users'] as $userId) {
                // Skip if already broadcasted
                if (in_array($userId, $broadcastedUsers)) {
                    continue;
                }
                
                $assignedUser = \App\Models\User::find($userId);
                if ($assignedUser && $assignedUser->id !== $creatorId) {
                    Log::info('Broadcasting notification to user:', [
                        'user_id' => $assignedUser->id,
                        'user_name' => $assignedUser->name,
                        'goal_id' => $goal->id,
                        'goal_title' => $goal->title
                    ]);
                    
                    try {
                        // Create and broadcast the event
                        $event = new \App\Events\GoalAssignedNotification($goal, $assignedUser, $creator, 'assigned');
                        broadcast($event);
                        $broadcastedUsers[] = $userId;
                        Log::info('Notification broadcasted successfully to user: ' . $assignedUser->id);
                    } catch (\Exception $e) {
                        Log::error('Failed to broadcast notification: ' . $e->getMessage());
                    }
                }
            }
        }

        return $goal;
    }

    /**
     * Update an existing Goal and re-sync assigned users.
     */
    public function updateGoal(Goal $goal, array $data): Goal
    {
        $oldAssignedUsers = $goal->assignedUsers->pluck('id')->toArray();
        $newAssignedUsers = $data['assigned_users'] ?? [];
        
        $goal->update([
            'title' => $data['title'],
            'slug' => Str::slug($data['title']),
            'description' => $data['description'],
            'type' => $data['type'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
        ]);

        // Sync assigned users
        $goal->assignedUsers()->sync($newAssignedUsers);
        
        // Find newly assigned users
        $newlyAssigned = array_diff($newAssignedUsers, $oldAssignedUsers);
        $removedUsers = array_diff($oldAssignedUsers, $newAssignedUsers);
        
        $updater = Auth::user();
        
        // Notify newly assigned users
        foreach ($newlyAssigned as $userId) {
            $assignedUser = \App\Models\User::find($userId);
            if ($assignedUser && $assignedUser->id !== $updater->id) {
                broadcast(new GoalAssignedNotification($goal, $assignedUser, $updater, 'assigned'))->toOthers();
            }
        }
        
        // Notify removed users (optional)
        foreach ($removedUsers as $userId) {
            $removedUser = \App\Models\User::find($userId);
            if ($removedUser) {
                broadcast(new GoalAssignedNotification($goal, $removedUser, $updater, 'removed'))->toOthers();
            }
        }

        return $goal;
    }
}