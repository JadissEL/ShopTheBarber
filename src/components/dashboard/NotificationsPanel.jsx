import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, MailOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NotificationsPanel({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });

  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return sovereign.entities.Notification.filter({ user_id: user.id }, '-created_at', 20);
    },
    enabled: !!user?.id
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => sovereign.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-notifications']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sovereign.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-notifications']);
    }
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 bg-card border-border">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between bg-white">
            <SheetTitle className="text-foreground">Notifications</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const unread = notifications.filter(n => !n.is_read);
                unread.forEach(n => markReadMutation.mutate(n.id));
              }}
            >
              <Check className="w-4 h-4 mr-1" /> Mark all read
            </Button>
          </SheetHeader>

          <ScrollArea className="flex-1 bg-muted/30">
            <div className="p-2">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group relative flex gap-3 p-3 rounded-lg transition-all hover:bg-muted ${!notification.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notification.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {notification.type === 'message' ? <MailOpen className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.content}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {notification.created_at && formatDistanceToNow(new Date(notification.created_at.replace(' ', 'T')), { addSuffix: true })}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8"
                        onClick={() => deleteMutation.mutate(notification.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
