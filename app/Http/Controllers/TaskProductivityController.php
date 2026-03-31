<?php

namespace App\Http\Controllers;

use App\Concerns\GoalProgressUpdater;
use App\Http\Requests\ApproveResubmissionRequest;
use App\Http\Requests\RejectSubmissionRequest;
use App\Http\Requests\StoreSubmissionRequest;
use App\Models\TaskProductivity;
use App\Models\Task;
use App\Services\TaskProductivityService;
use Inertia\Inertia;

class TaskProductivityController extends Controller
{
    use GoalProgressUpdater;

    public function __construct(protected TaskProductivityService $productivityService)
    {
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    public function submit(Task $task)
    {
        return Inertia::render('productivities/submit', compact('task'));
    }

    public function rejectSubmissionForm(TaskProductivity $submission)
    {
        $submission = TaskProductivity::with(['task.goal', 'user', 'taskProductivityFiles'])
            ->findOrFail($submission->id);

        return Inertia::render('productivities/reject', [
            'submission' => $submission,
        ]);
    }

    public function showResubmitForm(Task $task, $id)
    {
        $productivity = TaskProductivity::with('taskProductivityFiles', 'user')
            ->findOrFail($id);

        return Inertia::render('productivities/resubmit', [
            'task'       => $task,
            'submission' => $productivity,
        ]);
    }

    public function lateResubmitForm(Task $task)
    {
        return Inertia::render('productivities/late-resubmit', [
            'task' => $task,
        ]);
    }

    // -------------------------------------------------------------------------
    // Staff-initiated actions
    // -------------------------------------------------------------------------

    public function storeSubmission(StoreSubmissionRequest $request, Task $task)
    {
        $goal = $task->goal;

        $this->productivityService->storeSubmission(
            $request->validated(),
            $request->file('files'),
            $task
        );

        return redirect("/goals/{$goal->slug}")->with('success', 'Task submitted successfully.');
    }

    public function resubmit(StoreSubmissionRequest $request, Task $task, TaskProductivity $submission)
    {
        $goal = $task->goal;

        $this->productivityService->resubmit(
            $request->validated(),
            $request->file('files'),
            $task
        );

        $this->updateGoalProgress($goal);

        return redirect("/goals/{$goal->slug}")->with('success', 'Task resubmitted successfully.');
    }

    public function storeLateResubmit(StoreSubmissionRequest $request, Task $task)
    {
        $goal = $task->goal;

        $this->productivityService->storeLateResubmit(
            $request->validated(),
            $request->file('files'),
            $task
        );

        return redirect("/goals/{$goal->slug}")->with('success', 'Task resubmitted successfully.');
    }

    public function requestResubmission(Task $task)
    {
        $this->productivityService->requestResubmission($task);

        return redirect()->back()->with('success', 'Task resubmission requested successfully.');
    }

    // -------------------------------------------------------------------------
    // Project Manager actions
    // -------------------------------------------------------------------------

    public function approveSubmission(TaskProductivity $submission)
    {
        $this->productivityService->approveSubmission($submission);
        $this->updateGoalProgress($submission->task->goal);

        return redirect()->back()->with('success', 'Task approved successfully.');
    }

    public function reject(RejectSubmissionRequest $request, TaskProductivity $submission)
    {
        $this->productivityService->rejectSubmission($submission, $request->validated()['remarks']);

        return redirect("/goals/{$submission->task->goal->slug}")->with('success', 'Submission rejected successfully.');
    }

    public function approveResubmission(ApproveResubmissionRequest $request, Task $task)
    {
        $this->productivityService->approveResubmission($task, $request->validated()['deadline']);

        return redirect()->back()->with('success', 'Task resubmission approved successfully.');
    }

    public function rejectResubmission(Task $task)
    {
        $this->productivityService->rejectResubmission($task);

        return redirect()->back()->with('success', 'Task resubmission rejected successfully.');
    }
}