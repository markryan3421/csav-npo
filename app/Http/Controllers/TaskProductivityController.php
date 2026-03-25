<?php

namespace App\Http\Controllers;

use App\Concerns\GoalProgressUpdater;
use App\Models\TaskProductivity;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TaskProductivityController extends Controller
{
    use GoalProgressUpdater;

    public function submit(Task $task)
    {
        return Inertia::render('productivities/submit', compact('task'));
    }

    public function storeSubmission(Request $request, Task $task)
    {
        $goal = $task->goal;

        $request->validate([
            'subject' => 'required|string|max:255',
            'comments' => 'nullable|string',
            'files' => 'required',
            'files.*' => 'file|mimes:doc,docx,pdf,xls,xlsx,ppt,pptx|max:20480',
        ]);

        // Check if a productivity record already exists for this user & task today
        $taskProductivity = TaskProductivity::firstOrCreate(
            [
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'date' => now()->toDateString(),
            ],
            [
                'sdg_id' => $task->sdg_id,
                'goal_id' => $task->goal_id,
                'subject' => $request->subject,
                'comments' => $request->comments,
                'status' => 'pending',
                'remarks' => 'Pending for review',
            ]
        );

        // Attach multiple uploaded files
        foreach ($request->file('files') as $file) {
            $filePath = $file->store('task_productivities', 'public');

            $taskProductivity->taskProductivityFiles()->create([
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'file_type' => $file->getClientMimeType(),
                'file_path' => $filePath,
            ]);
        }

        // // Update progress and notify project manager
        // $this->updateGoalProgress($goal);
        // $goal->load('projectManager');
        // $sender = Auth::user();

        // if ($goal->projectManager) {
        //     $goal->projectManager->notify(new TaskStatusNotification(
        //         "{$sender->name} submitted a task for {$goal->title}.",
        //         "Go check it out.",
        //         route('goals.show', ['goal' => $goal->slug]),
        //         $goal->id,
        //         $sender,
        //         $goal
        //     ));
        // }

        return redirect("/goals/$goal->slug")->with('success', 'Task submitted successfully.');
    }

    // Approve submission
    public function approveSubmission(TaskProductivity $submission)
    {
        $submission->update([
            'status' => 'approved',
            'remarks' => "Approved by: " . Auth::user()->name,
        ]);

        $submission->save();

        $this->updateGoalProgress($submission->task->goal);

        return redirect()->back()->with('success', 'Task approved successfully.');
    }

    // Reject form
    public function rejectForm(TaskProductivity $submission)
    {
        $submission = TaskProductivity::with(['task.goal', 'user', 'taskProductivityFiles'])
            ->findOrFail($submission->id);

        return Inertia::render('productivities/reject', [
            'submission' => $submission,
        ]);
    }

    // Reject data
    public function reject(Request $request, TaskProductivity $submission)
    {
        $request->validate([
            'remarks' => 'required|string|min:3',
        ]);

        $submission->update([
            'status' => 'rejected',
            'remarks' => $request->remarks,
        ]);

        // Optionally update goal progress if needed
        // $this->updateGoalProgress($submission->task->goal);

        return redirect("/goals/{$submission->task->goal->slug}")->with('success', 'Submission rejected successfully.');
    }

    // Resubmit form (rejected)
    public function resubmitForm(Task $task, $id)
    {
        $productivity = TaskProductivity::with('taskProductivityFiles', 'user')
            ->findOrFail($id);

        return Inertia::render('productivities/resubmit', [
            'task' => $task,
            'submission' => $productivity,
        ]);
    }

    // Resubmit data
    public function resubmit(Request $request, Task $task, TaskProductivity $submission)
    {
        // Validate incoming data from the resubmit form
        $incomingFields = $request->validate([
            'subject' => 'required|string|max:255',
            'comments' => 'nullable|string',
            'files' => 'required',
            'files.*' => 'file|mimes:doc,docx,pdf,xls,xlsx,ppt,pptx|max:20480',
        ]);

        // Find existing productivity
        $pastSubmissions = TaskProductivity::where('task_id', '=', $task->id)->first();

        // If exists, delete that productivity
        if ($pastSubmissions) {
            foreach ($pastSubmissions->taskProductivityFiles as $file) {
                // delete the files
                Storage::disk('public')->delete($file->file_path);
            }
            // delete DB records
            $pastSubmissions->taskProductivityFiles()->delete();
            $pastSubmissions->delete();
        }

        $updatedSubmission = TaskProductivity::create([
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'updated_at' => now()->toDateString(),
            'sdg_id' => $task->sdg_id,
            'goal_id' => $task->goal_id,
            'subject' => $incomingFields['subject'],
            'comments' => $incomingFields['comments'],
            'status' => 'pending',
            'remarks' => 'Pending for review',
            'date' => now()->toDateString(),
        ]);

        // upload and save the new files
        foreach ($incomingFields['files'] as $file) {
            $filePath = $file->store('task_productivities', 'public');

            $updatedSubmission->taskProductivityFiles()->create([
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'file_type' => $file->getClientMimeType(),
                'file_path' => $filePath,
            ]);
        }

        // Update goal progress after resubmission
        $this->updateGoalProgress($updatedSubmission->task->goal);

        $goal = $task->goal;
        // // Send notification
        // $goal->load('projectManager');
        // $sender = Auth::user(); // The staff submitting that task

        // // Check if the project manager exists
        // if ($goal->projectManager) {
        //     $goal->projectManager->notify(new TaskStatusNotification(
        //         "{$sender->name} resubmitted a task for {$task->title}.",
        //         "Go check it out.",
        //         route('goals.show', ['goal' => $goal->slug]),
        //         $goal->id,
        //         $sender,
        //         $goal
        //     ));
        // }

        // Redirect back to the goal page or to the task detail
        return redirect("/goals/$goal->slug")->with('success', 'Task resubmitted successfully.');
    }
}
