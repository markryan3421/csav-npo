import { useState, useEffect, useRef } from 'react';
import { Bell, X, UserPlus, Target, ClipboardList, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Link } from '@inertiajs/react';
import echo from '@/echo';
import { showToast } from '@/components/toast';

interface Notification {
    id: string;
    goal_id: number;
    goal_slug: string;
    goal_title: string;
    task_id?: number;
    task_slug?: string;
    task_title?: string;
    message: string;
    type: string;
    assigned_by?: { id: number; name: string };
    triggered_by?: { id: number; name: string };
    timestamp: string;
    read: boolean;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const processedNotifications = useRef<Set<string>>(new Set());

    useEffect(() => {
        fetchNotifications();

        const userId = document.querySelector('meta[name="user-id"]')?.getAttribute('content');

        if (userId && echo) {
            if (echo.connector?.pusher) {
                echo.connector.pusher.connection.bind('connected', () => {
                    console.log('✅ Connected to Reverb');
                    setIsConnected(true);
                });
                echo.connector.pusher.connection.bind('error', (err: any) => {
                    console.error('❌ Reverb connection error:', err);
                    setIsConnected(false);
                });
            }

            const channel = echo.private(`user.${userId}`);

            channel.subscribed(() => console.log(`✅ Subscribed to user.${userId}`));

            channel.listen('.goal.notification', (data: any) => {
                const key = `goal-${data.id}-${data.goal_id}-${data.timestamp}`;
                if (processedNotifications.current.has(key)) return;
                processedNotifications.current.add(key);
                handleIncomingNotification(data);
            });

            channel.listen('.task.notification', (data: any) => {
                const key = `task-${data.id}-${data.task_id}-${data.timestamp}`;
                if (processedNotifications.current.has(key)) return;
                processedNotifications.current.add(key);
                handleIncomingNotification(data);
            });

            channel.listen('.productivity.notification', (data: any) => {
                const key = `prod-${data.id}-${data.task_id}-${data.timestamp}`;
                if (processedNotifications.current.has(key)) return;
                processedNotifications.current.add(key);
                handleIncomingNotification(data);
            });
        }

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            const userId = document.querySelector('meta[name="user-id"]')?.getAttribute('content');
            if (echo && userId) echo.leaveChannel(`private-user.${userId}`);
        };
    }, []);

    const handleIncomingNotification = (data: any) => {
        if (!data?.goal_id || !data?.message) {
            console.error('Invalid notification data:', data);
            return;
        }

        showToast.info(data.message);

        const newNotification: Notification = {
            id: data.id?.toString() ?? Date.now().toString(),
            goal_id: data.goal_id,
            goal_slug: data.goal_slug ?? String(data.goal_id),
            goal_title: data.goal_title ?? `Goal ${data.goal_id}`,
            task_id: data.task_id,
            task_slug: data.task_slug,
            task_title: data.task_title,
            message: data.message,
            type: data.type ?? 'unknown',
            assigned_by: data.assigned_by,
            triggered_by: data.triggered_by,
            timestamp: data.timestamp ?? new Date().toISOString(),
            read: false,
        };

        setNotifications(prev => {
            if (prev.some(n => n.id === newNotification.id)) return prev;
            return [newNotification, ...prev];
        });

        setUnreadCount(prev => prev + 1);

        if (Notification.permission === 'granted') {
            new Notification(resolveNotificationTitle(newNotification.type), {
                body: data.message,
                icon: '/favicon.ico',
            });
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    /**
     * Build the notification href:
     *
     * - Task-related notifications  → /goals/{goal_slug}#task-{task_slug}
     *   The goal show page reads the hash on mount, scrolls to the element,
     *   and briefly highlights it.
     *
     * - Goal-level notifications    → /goals/{goal_slug}
     */
    const getNotificationHref = (n: Notification): string => {
        if (n.task_slug && n.goal_slug) {
            return `/goals/${n.goal_slug}#task-${n.task_slug}`;
        }
        return `/goals/${n.goal_slug}`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-black text-accent-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-border bg-card shadow-xl">
                        <div className="flex items-center justify-between border-b border-border p-4">
                            <h3 className="text-sm font-bold text-foreground">
                                Notifications
                                {!isConnected && (
                                    <span className="ml-2 text-xs text-yellow-500">(Offline)</span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
                                    <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <Link
                                        key={notification.id}
                                        href={getNotificationHref(notification)}
                                        className={`block border-b border-border p-4 transition-colors hover:bg-muted/30 ${
                                            !notification.read ? 'bg-primary/5' : ''
                                        }`}
                                        onClick={() => {
                                            markAsRead(notification.id);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-foreground">{notification.message}</p>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{new Date(notification.timestamp).toLocaleString()}</span>
                                                    {!notification.read && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveNotificationTitle(type: string): string {
    if (type.startsWith('submission_') || type.startsWith('resubmission_')) return 'Task Submission Update';
    if (type.startsWith('task_')) return 'Task Update';
    return 'New Notification';
}

function getNotificationIcon(type: string) {
    switch (type) {
        case 'assigned':
            return <UserPlus className="h-4 w-4 text-primary" />;
        case 'removed':
            return <X className="h-4 w-4 text-accent" />;
        case 'task_created':
        case 'task_updated':
            return <ClipboardList className="h-4 w-4 text-primary" />;
        case 'submission_created':
        case 'submission_resubmitted':
        case 'submission_late_resubmitted':
        case 'resubmission_requested':
            return <RefreshCw className="h-4 w-4 text-yellow-500" />;
        case 'submission_approved':
        case 'resubmission_approved':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'submission_rejected':
        case 'resubmission_rejected':
            return <XCircle className="h-4 w-4 text-red-500" />;
        default:
            return <Target className="h-4 w-4 text-secondary" />;
    }
}