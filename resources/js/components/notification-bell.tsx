import { useState, useEffect, useRef } from 'react';
import { Bell, X, UserPlus, Target } from 'lucide-react';
import { Link } from '@inertiajs/react';
import echo from '@/echo';
import { showToast } from '@/components/toast';

interface Notification {
    id: string;
    goal_id: number;
    goal_slug: string;
    goal_title: string;
    message: string;
    type: string;
    assigned_by: {
        id: number;
        name: string;
    };
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
        console.log('Current user ID:', userId);
        
        if (userId && echo) {
            console.log('Setting up echo listener for user:', userId);
            
            if (echo.connector && echo.connector.pusher) {
                echo.connector.pusher.connection.bind('connected', () => {
                    console.log('✅ Connected to Reverb');
                    setIsConnected(true);
                });
                
                echo.connector.pusher.connection.bind('error', (err: any) => {
                    console.error('❌ Reverb connection error:', err);
                    setIsConnected(false);
                });
            }
            
            const channelName = `user.${userId}`;
            console.log('Subscribing to channel:', channelName);
            
            const channel = echo.private(channelName);
            
            channel.subscribed(() => {
                console.log('✅ Subscribed to channel:', channelName);
            });
            
            channel.listen('.goal.notification', (data: any) => {
                console.log('🔔 NOTIFICATION RECEIVED!', data);
                
                const notificationKey = `${data.id}-${data.goal_id}-${data.timestamp}`;
                if (processedNotifications.current.has(notificationKey)) {
                    console.log('Duplicate notification ignored');
                    return;
                }
                processedNotifications.current.add(notificationKey);
                
                handleNotification(data);
            });
        }
        
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        return () => {
            if (echo && userId) {
                echo.leaveChannel(`user.${userId}`);
            }
        };
    }, []);

    const handleNotification = (data: any) => {
        if (!data || !data.goal_id || !data.message) {
            console.error('Invalid notification data:', data);
            return;
        }
        
        // Show toast notification
        showToast.info(data.message);
        
        const newNotification: Notification = {
            id: data.id ? data.id.toString() : Date.now().toString(),
            goal_id: data.goal_id,
            goal_slug: data.goal_slug || data.goal_id.toString(),
            goal_title: data.goal_title || `Goal ${data.goal_id}`,
            message: data.message,
            type: data.type || 'assigned',
            assigned_by: data.assigned_by || { id: 0, name: 'System' },
            timestamp: data.timestamp || new Date().toISOString(),
            read: false,
        };
        
        setNotifications(prev => {
            const exists = prev.some(n => n.id === newNotification.id);
            if (exists) return prev;
            return [newNotification, ...prev];
        });
        
        setUnreadCount(prev => prev + 1);
        
        if (Notification.permission === 'granted') {
            new Notification('New Goal Assignment', {
                body: data.message,
                icon: '/favicon.ico',
            });
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            const notificationsList = data.notifications || [];
            const unread = data.unread_count || 0;
            
            setNotifications(notificationsList);
            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'assigned':
                return <UserPlus className="h-4 w-4 text-primary" />;
            case 'removed':
                return <X className="h-4 w-4 text-accent" />;
            default:
                return <Target className="h-4 w-4 text-secondary" />;
        }
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
                                notifications.map((notification) => (
                                    <Link
                                        key={notification.id}
                                        href={`/goals/${notification.goal_slug}`}
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