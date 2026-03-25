<?php

namespace App\Http\Controllers;

use App\Concerns\GoalProgressUpdater;
use App\Models\Goal;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskStatusNotification;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TaskController extends Controller
{
    use GoalProgressUpdater;

    public function addTask(Goal $goal)
    {
        return view('tasks.add-task', compact('goal'));
    }

    public function allTask()
    {
        $goalsWithTasks = Goal::with('tasks')->latest()->get();

        return view('tasks.all-tasks', compact('goalsWithTasks'));
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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
    public function store(Request $request, Goal $goal)
    {
        $incomingFields = $request->validate([
            'title' => 'required|max:255',
            'description' => 'nullable',
            'deadline' => [
                'required',
                'date',
                'after_or_equal:today',
                function ($attribute, $value, $fail) use ($goal) {
                    if ($goal && $goal->end_date) {
                        $taskDeadline = \Carbon\Carbon::parse($value);
                        $goalDeadline = \Carbon\Carbon::parse($goal->end_date);

                        if ($taskDeadline->gt($goalDeadline)) {
                            $fail("The {$attribute} cannot be later than the goal's deadline ({$goalDeadline->toFormattedDateString()}).");
                        }
                    }
                },
            ],
        ]);

        $task = $goal->tasks()->create([
            'goal_id' => $goal->id,
            'sdg_id' => $goal->sdg_id,
            'slug' => Str::slug($incomingFields['title']),
            'title' => $incomingFields['title'],
            'description' => $incomingFields['description'],
            'status' => 'pending',
            'deadline' => $incomingFields['deadline'],
        ]);

        $goal = $task->goal;
        // $this->updateGoalProgress($goal);

        // Send notification
        $sender = Auth::user();

        // Notify the staffs assigned
        $assignedUsers = $goal->assignedUsers;

        // foreach($assignedUsers as $user) {
        //     $user->notify(new TaskStatusNotification(
        //         "{$sender->name} assigned you a new task for {$goal->title}.",
        //         "Go check it out.",
        //         route('goals.show', ['goal' => $goal->slug]) . "#task-{$task->slug}",
        //         $goal->id,
        //         $sender,
        //         $goal
        //     ));
        // }

        return redirect("/goals/$goal->slug")->with('success', 'Task created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Task $task)
    {
        //
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
    public function update(Request $request, Goal $goal, Task $task)
    {
        $incomingFields = $request->validate([
            'title' => 'required|max:255',
            'description' => 'required',
            // 'status' => 'required|in:pending,in-progress,completed',
            'deadline' => 'required|date|after_or_equal:today',
        ]);

        $task->update([
            'goal_id' => $goal->id,
            'sdg_id' => $goal->sdg_id,
            'title' => $incomingFields['title'],
            'slug' => Str::slug($incomingFields['title']),
            'description' => $incomingFields['description'],
            // 'status' => $incomingFields['status'],
            'deadline' => $incomingFields['deadline'],
        ]);

        $goal = $task->goal;

        $goal->load('projectManager');
        $sender = Auth::user();
        $assignedUsers = $goal->assignedUsers;

        // // Notify the staffs assigned
        // foreach ($assignedUsers as $user) {
        //     $user->notify(new TaskStatusNotification(
        //         "{$sender->name} made some changes in {$goal->title} task.",
        //         "Go check it out.",
        //         route('goals.show', ['goal' => $goal->slug]),
        //         $goal->id,
        //         $sender,
        //         $goal
        //     ));
        // }

        return redirect("/goals/{$goal->slug}")->with('success', 'Task updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Goal $goal, Task $task)
    {
        $goal = $task->goal;
        $task->delete();

        return redirect()->back()->with('success', 'Task deleted successfully.');
    }
}
