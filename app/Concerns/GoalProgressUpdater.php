<?php

namespace App\Concerns;

use App\Models\Goal;

trait GoalProgressUpdater
{
    protected function updateGoalProgress(Goal $goal)
    {
        // Step 1: Get all tasks under this goal
        $tasks = $goal->tasks;

        // Step 2: Count total tasks
        $totalTasks = $tasks->count();

        // Step 3: Initialize counters
        $completedTasks = 0;
        $inProgressCount = 0;
        $pendingCount = 0;

        // Step 4: Loop through each task to update task status
        foreach ($tasks as $task) {
            // Get all productivity submissions for this task
            $productivities = $task->taskProductivities;

            // No submissions means pending
            if ($productivities->isEmpty()) {
                $task->status = 'pending';
                $pendingCount++;
                $task->save();
                continue;
            }

            // Check if all submissions are approved
            $allApproved = $productivities->every(fn($p) => $p->status === 'approved');

            // Check if at least one is approved
            $anyApproved = $productivities->contains(fn($p) => $p->status === 'approved');

            // Set task status
            if ($allApproved) {
                $task->status = 'completed';
                $completedTasks++;
            } elseif ($anyApproved) {
                $task->status = 'in-progress';
                $inProgressCount++;
            } else {
                $task->status = 'pending';
                $pendingCount++;
            }

            // Save task status
            $task->save();
        }

        // Step 5: Compute goal compliance percentage
        $percentage = $totalTasks > 0 ? ($completedTasks / $totalTasks) * 100 : 0;
        $goal->compliance_percentage = round($percentage, 2);

        // Step 6: Update goal status based on tasks
        if ($totalTasks === $completedTasks && $totalTasks > 0) {
            $goal->status = 'completed';
        } elseif ($completedTasks > 0 || $inProgressCount > 0) {
            $goal->status = 'in-progress';
        } else {
            $goal->status = 'pending';
        }

        // Step 7: Save goal
        $goal->save();
    }
}
