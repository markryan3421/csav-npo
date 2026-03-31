<?php

namespace App\Services;

use App\Events\ProductivityNotification;
use App\Models\Goal;
use App\Models\Task;
use App\Models\TaskProductivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TaskProductivityService
{
    // -------------------------------------------------------------------------
    // Staff-initiated actions  (notify the Project Manager)
    // -------------------------------------------------------------------------

    /**
     * Create a new submission and notify the goal's project manager.
     */
    public function storeSubmission(array $data, array $files, Task $task): TaskProductivity
    {
        $goal = $task->goal;

        $productivity = TaskProductivity::firstOrCreate(
            [
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'date'    => now()->toDateString(),
            ],
            [
                'sdg_id'   => $task->sdg_id,
                'goal_id'  => $task->goal_id,
                'subject'  => $data['subject'],
                'comments' => $data['comments'] ?? null,
                'status'   => 'pending',
                'remarks'  => 'Pending for review',
            ]
        );

        $this->attachFiles($productivity, $files);

        $this->notifyProjectManager($task, $goal, Auth::user(), 'submission_created');

        return $productivity;
    }

    /**
     * Replace an existing submission with new files and notify the PM.
     */
    public function resubmit(array $data, array $files, Task $task): TaskProductivity
    {
        $goal = $task->goal;

        // Delete the old submission and its files
        $past = TaskProductivity::where('task_id', $task->id)->first();
        if ($past) {
            foreach ($past->taskProductivityFiles as $file) {
                Storage::disk('public')->delete($file->file_path);
            }
            $past->taskProductivityFiles()->delete();
            $past->delete();
        }

        $productivity = TaskProductivity::create([
            'task_id'  => $task->id,
            'user_id'  => Auth::id(),
            'sdg_id'   => $task->sdg_id,
            'goal_id'  => $task->goal_id,
            'subject'  => $data['subject'],
            'comments' => $data['comments'] ?? null,
            'status'   => 'pending',
            'remarks'  => 'Pending for review',
            'date'     => now()->toDateString(),
        ]);

        $this->attachFiles($productivity, $files);

        $this->notifyProjectManager($task, $goal, Auth::user(), 'submission_resubmitted');

        return $productivity;
    }

    /**
     * Create or update a late resubmission and notify the PM.
     */
    public function storeLateResubmit(array $data, array $files, Task $task): TaskProductivity
    {
        $goal = $task->goal;

        $productivity = TaskProductivity::updateOrCreate(
            [
                'task_id'    => $task->id,
                'user_id'    => Auth::id(),
                'updated_at' => now()->toDateString(),
            ],
            [
                'sdg_id'   => $task->sdg_id,
                'goal_id'  => $task->goal_id,
                'subject'  => $data['subject'],
                'comments' => $data['comments'] ?? null,
                'status'   => 'pending',
                'remarks'  => 'Pending for review',
                'date'     => now()->toDateString(),
            ]
        );

        foreach ($files as $file) {
            $filePath = $file->store('task_productivities', 'public');
            $productivity->taskProductivityFiles()->updateOrCreate([
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'file_type' => $file->getClientMimeType(),
                'file_path' => $filePath,
            ]);
        }

        $this->notifyProjectManager($task, $goal, Auth::user(), 'submission_late_resubmitted');

        return $productivity;
    }

    /**
     * Flag a task as requesting resubmission and notify the PM.
     */
    public function requestResubmission(Task $task): void
    {
        $actor = Auth::user();

        $task->update([
            'status'  => 'resubmission_requested',
            'remarks' => "Requested resubmission by: {$actor->name}",
        ]);

        $this->notifyProjectManager($task, $task->goal, $actor, 'resubmission_requested');
    }

    // -------------------------------------------------------------------------
    // Project Manager actions  (notify the staff who submitted)
    // -------------------------------------------------------------------------

    /**
     * Approve a submission and notify the staff member who submitted it.
     */
    public function approveSubmission(TaskProductivity $submission): void
    {
        $actor = Auth::user();

        $submission->update([
            'status'  => 'approved',
            'remarks' => "Approved by: {$actor->name}",
        ]);

        $this->notifySubmitter($submission->task, $submission->task->goal, $submission->user, $actor, 'submission_approved');
    }

    /**
     * Reject a submission with remarks and notify the staff member.
     */
    public function rejectSubmission(TaskProductivity $submission, string $remarks): void
    {
        $actor = Auth::user();

        $submission->update([
            'status'  => 'rejected',
            'remarks' => $remarks,
        ]);

        $this->notifySubmitter($submission->task, $submission->task->goal, $submission->user, $actor, 'submission_rejected');
    }

    /**
     * Approve a resubmission request with a new deadline and notify the staff.
     */
    public function approveResubmission(Task $task, string $deadline): void
    {
        $actor = Auth::user();

        $task->update([
            'deadline' => $deadline,
            'status'   => 'approved_resubmission',
            'remarks'  => "Approved resubmission by: {$actor->name}",
        ]);

        // Notify all staff assigned to the goal (they all need to know)
        $this->notifyAssignedUsers($task, $task->goal, $actor, 'resubmission_approved');
    }

    /**
     * Reject a resubmission request and notify the staff.
     */
    public function rejectResubmission(Task $task): void
    {
        $actor = Auth::user();

        $task->update([
            'status'  => 'rejected_resubmission',
            'remarks' => "Rejected resubmission by: {$actor->name}",
        ]);

        $this->notifyAssignedUsers($task, $task->goal, $actor, 'resubmission_rejected');
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Attach uploaded files to a TaskProductivity record.
     */
    private function attachFiles(TaskProductivity $productivity, array $files): void
    {
        foreach ($files as $file) {
            $filePath = $file->store('task_productivities', 'public');
            $productivity->taskProductivityFiles()->create([
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'file_type' => $file->getClientMimeType(),
                'file_path' => $filePath,
            ]);
        }
    }

    /**
     * Notify the goal's project manager (creator).
     */
    private function notifyProjectManager(Task $task, Goal $goal, User $triggeredBy, string $type): void
    {
        $goal->loadMissing('projectManager');
        $pm = $goal->projectManager;

        if (!$pm || $pm->id === $triggeredBy->id) {
            return; // No PM set, or PM is the one acting — skip
        }

        $this->broadcast($task, $goal, $pm, $triggeredBy, $type);
    }

    /**
     * Notify a specific staff member (the submission owner).
     */
    private function notifySubmitter(Task $task, Goal $goal, User $submitter, User $triggeredBy, string $type): void
    {
        if ($submitter->id === $triggeredBy->id) {
            return;
        }

        $this->broadcast($task, $goal, $submitter, $triggeredBy, $type);
    }

    /**
     * Notify all staff assigned to a goal (used for PM → staff broadcasts).
     * Skips the actor themselves.
     */
    private function notifyAssignedUsers(Task $task, Goal $goal, User $triggeredBy, string $type): void
    {
        $goal->loadMissing('assignedUsers');

        foreach ($goal->assignedUsers as $user) {
            if ($user->id === $triggeredBy->id) {
                continue;
            }

            $this->broadcast($task, $goal, $user, $triggeredBy, $type);
        }
    }

    /**
     * Fire and log a ProductivityNotification broadcast.
     */
    private function broadcast(Task $task, Goal $goal, User $notifiedUser, User $triggeredBy, string $type): void
    {
        try {
            broadcast(new ProductivityNotification($task, $goal, $notifiedUser, $triggeredBy, $type));
            Log::info("ProductivityNotification [{$type}] sent to user {$notifiedUser->id} for task {$task->id}");
        } catch (\Exception $e) {
            Log::error("Failed to broadcast ProductivityNotification to user {$notifiedUser->id}: " . $e->getMessage());
        }
    }
}