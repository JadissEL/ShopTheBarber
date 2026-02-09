import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter({ isDark = false }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });

    const { data: notifications = [] } = useQuery({
        queryKey: ['user-notifications', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            return sovereign.entities.Notification.filter({ user_id: user.id }, '-created_at', 20);
        },
        enabled: !!user?.id,
        refetchInterval: 30000 // Poll every 30s
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsReadMutation = useMutation({
        mutationFn: (id) => sovereign.entities.Notification.update(id, { is_read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries(['user-notifications']);
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const unread = notifications.filter(n => !n.is_read);
            await Promise.all(unread.map(n => sovereign.entities.Notification.update(n.id, { is_read: true })));
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['user-notifications']);
        }
    });

    const handleClick = (notification) => {
        if (!notification.is_read) {
            markAsReadMutation.mutate(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    if (!user) return null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`relative transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="text-xs text-primary hover:underline"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleClick(notification)}
                                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3 items-start ${!notification.is_read ? 'bg-primary/5' : ''}`}
                                >
                                    <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!notification.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                                    <div className="flex-1 space-y-1">
                                        <p className={`text-sm ${!notification.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.content}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground pt-1">
                                            {notification.created_at ? formatDistanceToNow(new Date(notification.created_at.replace(' ', 'T')), { addSuffix: true }) : 'Just now'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => navigate('/notifications')}>
                        View all notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
