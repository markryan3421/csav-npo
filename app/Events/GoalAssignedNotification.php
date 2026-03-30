<?php

namespace App\Events;

use App\Models\Goal;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class GoalAssignedNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $goalId;
    public $goalSlug;
    public $goalTitle;
    public $assignedToId;
    public $assignedByName;
    public $assignedById;
    public $message;
    public $type;
    public $notificationId;
    public $timestamp;

    /**
     * Create a new event instance.
     */
    public function __construct(Goal $goal, User $assignedTo, User $assignedBy, string $type = 'assigned')
    {
        // Store primitive values instead of model instances
        $this->goalId = $goal->id;
        $this->goalSlug = $goal->slug;
        $this->goalTitle = $goal->title;
        $this->assignedToId = $assignedTo->id;
        $this->assignedByName = $assignedBy->name;
        $this->assignedById = $assignedBy->id;
        $this->type = $type;
        $this->timestamp = now()->toISOString();
        
        $this->message = $type === 'assigned' 
            ? "{$assignedBy->name} assigned you to goal: {$goal->title}"
            : "{$assignedBy->name} updated goal: {$goal->title}";
        
        // Check if notification already exists to prevent duplicates
        $existingNotification = Notification::where('user_id', $assignedTo->id)
            ->where('goal_id', $goal->id)
            ->where('type', $type)
            ->where('created_at', '>', now()->subSeconds(5))
            ->first();
        
        if (!$existingNotification) {
            // Store notification in database
            $notification = Notification::create([
                'id' => Str::uuid(),
                'user_id' => $assignedTo->id,
                'goal_id' => $goal->id,
                'type' => $type,
                'message' => $this->message,
                'data' => [
                    'goal_slug' => $goal->slug,
                    'goal_title' => $goal->title,
                    'assigned_by' => [
                        'id' => $assignedBy->id,
                        'name' => $assignedBy->name,
                    ],
                    'timestamp' => $this->timestamp,
                ],
                'read_at' => null,
            ]);
            
            $this->notificationId = $notification->id;
        } else {
            // Use existing notification ID
            $this->notificationId = $existingNotification->id;
        }
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->assignedToId}"),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'goal.notification';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->notificationId,
            'goal_id' => $this->goalId,
            'goal_slug' => $this->goalSlug,
            'goal_title' => $this->goalTitle,
            'message' => $this->message,
            'type' => $this->type,
            'assigned_by' => [
                'id' => $this->assignedById,
                'name' => $this->assignedByName,
            ],
            'timestamp' => $this->timestamp,
        ];
    }
}