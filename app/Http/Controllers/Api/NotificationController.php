<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'notifications' => [],
                'unread_count' => 0,
            ], 401);
        }
        
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'goal_id' => $notification->goal_id,
                    'goal_slug' => $notification->data['goal_slug'] ?? null,
                    'goal_title' => $notification->data['goal_title'] ?? null,
                    'message' => $notification->message,
                    'type' => $notification->type,
                    'assigned_by' => $notification->data['assigned_by'] ?? null,
                    'timestamp' => $notification->created_at->toISOString(),
                    'read' => $notification->read_at !== null,
                ];
            });
        
        $unreadCount = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
        
        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }
    
    public function markAsRead($id)
    {
        $user = Auth::user();
        $notification = Notification::where('user_id', $user->id)
            ->where('id', $id)
            ->first();
        
        if ($notification) {
            $notification->update(['read_at' => now()]);
            return response()->json(['success' => true]);
        }
        
        return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
    }
    
    public function markAllAsRead()
    {
        $user = Auth::user();
        Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        
        return response()->json(['success' => true]);
    }
}