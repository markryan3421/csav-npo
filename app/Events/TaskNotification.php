<?php

namespace App\Events;

use App\Models\Goal;
use App\Models\Task;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class TaskNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $goalId;
    public $goalSlug;
    public $goalTitle;
    public $taskId;
    public $taskSlug;
    public $taskTitle;
    public $assignedToId;
    public $triggeredByName;
    public $triggeredById;
    public $message;
    public $type;
    public $notificationId;
    public $timestamp;

    /**
     * Create a new event instance.
     *
     * @param string $type  'task_created' | 'task_updated'
     */
    public function __construct(Task $task, Goal $goal, User $assignedTo, User $triggeredBy, string $type = 'task_created')
    {
        $this->goalId        = $goal->id;
        $this->goalSlug      = $goal->slug;
        $this->goalTitle     = $goal->title;
        $this->taskId        = $task->id;
        $this->taskSlug      = $task->slug;
        $this->taskTitle     = $task->title;
        $this->assignedToId  = $assignedTo->id;
        $this->triggeredById  = $triggeredBy->id;
        $this->triggeredByName = $triggeredBy->name;
        $this->type          = $type;
        $this->timestamp     = now()->toISOString();

        $this->message = $type === 'task_created'
            ? "{$triggeredBy->name} created a new task \"{$task->title}\" under goal: {$goal->title}"
            : "{$triggeredBy->name} updated task \"{$task->title}\" under goal: {$goal->title}";

        // Prevent duplicate notifications within a 5-second window
        $existingNotification = Notification::where('user_id', $assignedTo->id)
            ->where('task_id', $task->id)
            ->where('type', $type)
            ->where('created_at', '>', now()->subSeconds(5))
            ->first();

        if (!$existingNotification) {
            $notification = Notification::create([
                'id'      => Str::uuid(),
                'user_id' => $assignedTo->id,
                'goal_id' => $goal->id,
                'task_id' => $task->id,
                'type'    => $type,
                'message' => $this->message,
                'data'    => [
                    'goal_slug'  => $goal->slug,
                    'goal_title' => $goal->title,
                    'task_slug'  => $task->slug,
                    'task_title' => $task->title,
                    'triggered_by' => [
                        'id'   => $triggeredBy->id,
                        'name' => $triggeredBy->name,
                    ],
                    'timestamp' => $this->timestamp,
                ],
                'read_at' => null,
            ]);

            $this->notificationId = $notification->id;
        } else {
            $this->notificationId = $existingNotification->id;
        }
    }

    /**
     * Broadcast on the assigned user's private channel.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->assignedToId}"),
        ];
    }

    /**
     * Custom broadcast event name — matches the existing listener pattern.
     */
    public function broadcastAs(): string
    {
        return 'task.notification';
    }

    /**
     * Payload sent to the frontend.
     */
    public function broadcastWith(): array
    {
        return [
            'id'         => $this->notificationId,
            'goal_id'    => $this->goalId,
            'goal_slug'  => $this->goalSlug,
            'goal_title' => $this->goalTitle,
            'task_id'    => $this->taskId,
            'task_slug'  => $this->taskSlug,
            'task_title' => $this->taskTitle,
            'message'    => $this->message,
            'type'       => $this->type,
            'triggered_by' => [
                'id'   => $this->triggeredById,
                'name' => $this->triggeredByName,
            ],
            'timestamp'  => $this->timestamp,
        ];
    }
}