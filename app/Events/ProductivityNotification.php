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

class ProductivityNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $goalId;
    public string $goalSlug;
    public string $goalTitle;
    public int $taskId;
    public string $taskSlug;
    public string $taskTitle;
    public int $notifiedUserId;   // who receives the notification
    public int $triggeredById;    // who caused it
    public string $triggeredByName;
    public string $message;
    public string $type;
    public string $notificationId;
    public string $timestamp;

    /**
     * Supported types:
     *   Staff → PM  : 'submission_created' | 'submission_resubmitted' | 'submission_late_resubmitted' | 'resubmission_requested'
     *   PM   → Staff: 'submission_approved' | 'submission_rejected' | 'resubmission_approved' | 'resubmission_rejected'
     */
    public function __construct(
        Task $task,
        Goal $goal,
        User $notifiedUser,
        User $triggeredBy,
        string $type
    ) {
        $this->goalId         = $goal->id;
        $this->goalSlug       = $goal->slug;
        $this->goalTitle      = $goal->title;
        $this->taskId         = $task->id;
        $this->taskSlug       = $task->slug;
        $this->taskTitle      = $task->title;
        $this->notifiedUserId = $notifiedUser->id;
        $this->triggeredById  = $triggeredBy->id;
        $this->triggeredByName = $triggeredBy->name;
        $this->type           = $type;
        $this->timestamp      = now()->toISOString();
        $this->message        = $this->resolveMessage($triggeredBy->name, $task->title, $type);

        // Prevent duplicate notifications within a 5-second window
        $existing = Notification::where('user_id', $notifiedUser->id)
            ->where('task_id', $task->id)
            ->where('type', $type)
            ->where('created_at', '>', now()->subSeconds(5))
            ->first();

        if (!$existing) {
            $notification = Notification::create([
                'id'      => Str::uuid(),
                'user_id' => $notifiedUser->id,
                'goal_id' => $goal->id,
                'task_id' => $task->id,
                'type'    => $type,
                'message' => $this->message,
                'data'    => [
                    'goal_slug'    => $goal->slug,
                    'goal_title'   => $goal->title,
                    'task_slug'    => $task->slug,
                    'task_title'   => $task->title,
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
            $this->notificationId = $existing->id;
        }
    }

    private function resolveMessage(string $name, string $taskTitle, string $type): string
    {
        return match ($type) {
            // Staff → PM
            'submission_created'        => "{$name} submitted task: \"{$taskTitle}\"",
            'submission_resubmitted'    => "{$name} resubmitted task: \"{$taskTitle}\"",
            'submission_late_resubmitted' => "{$name} submitted a late resubmission for task: \"{$taskTitle}\"",
            'resubmission_requested'    => "{$name} requested a resubmission for task: \"{$taskTitle}\"",
            // PM → Staff
            'submission_approved'       => "{$name} approved your submission for task: \"{$taskTitle}\"",
            'submission_rejected'       => "{$name} rejected your submission for task: \"{$taskTitle}\"",
            'resubmission_approved'     => "{$name} approved your resubmission request for task: \"{$taskTitle}\"",
            'resubmission_rejected'     => "{$name} rejected your resubmission request for task: \"{$taskTitle}\"",
            default                     => "{$name} performed an action on task: \"{$taskTitle}\"",
        };
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->notifiedUserId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'productivity.notification';
    }

    public function broadcastWith(): array
    {
        return [
            'id'           => $this->notificationId,
            'goal_id'      => $this->goalId,
            'goal_slug'    => $this->goalSlug,
            'goal_title'   => $this->goalTitle,
            'task_id'      => $this->taskId,
            'task_slug'    => $this->taskSlug,
            'task_title'   => $this->taskTitle,
            'message'      => $this->message,
            'type'         => $this->type,
            'triggered_by' => [
                'id'   => $this->triggeredById,
                'name' => $this->triggeredByName,
            ],
            'timestamp'    => $this->timestamp,
        ];
    }
}