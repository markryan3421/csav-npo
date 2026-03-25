<?php

namespace App\Http\Controllers;

use App\Concerns\GoalProgressUpdater;
use App\Models\TaskProductivity;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
}
