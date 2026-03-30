<?php

namespace App\Http\Controllers;

use App\Concerns\GoalProgressUpdater;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Goal;
use App\Models\Task;
use App\Services\TaskService;
use Inertia\Inertia;

class TaskController extends Controller
{
    use GoalProgressUpdater;

    public function __construct(protected TaskService $taskService)
    {
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Goal $goal)
    {
        return Inertia::render('tasks/create', [
            'goal' => $goal,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTaskRequest $request, Goal $goal)
    {
        $this->taskService->createTask($request->validated(), $goal);

        return redirect("/goals/{$goal->slug}")->with('success', 'Task created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Goal $goal, Task $task)
    {
        return Inertia::render('tasks/edit', compact('goal', 'task'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTaskRequest $request, Goal $goal, Task $task)
    {
        $this->taskService->updateTask($request->validated(), $goal, $task);

        return redirect("/goals/{$goal->slug}")->with('success', 'Task updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Goal $goal, Task $task)
    {
        $task->delete();

        return redirect()->back()->with('success', 'Task deleted successfully.');
    }
}