import React, { useEffect } from 'react';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function RealTimeNotifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // We need the current user ID to filter notifications
  // Using a lightweight check or relying on the auth context if available
  // Here we'll just use sovereign.auth.me() which might be cached
  const [userId, setUserId] = React.useState(null);

  useEffect(() => {
    sovereign.auth.me().then(u => setUserId(u?.id)).catch(() => { });
  }, []);

  useEffect(() => {
    if (!userId) return;

    console.log("Subscribing to notifications for user:", userId);

    const unsubscribe = sovereign.entities.Notification.subscribe((event) => {
      // We only care about CREATE events for NEW notifications
      if (event.type === 'create') {
        const notification = event.data;

        // Filter for current user
        if (notification.user_id === userId) {
          console.log("New notification received:", notification);

          // 1. Invalidate Query to update UI counts
          queryClient.invalidateQueries(['user-notifications']);

          // 2. Show Toast
          toast(notification.title, {
            description: notification.content,
            icon: <Bell className="w-4 h-4 text-primary" />,
            action: notification.link ? {
              label: "View",
              onClick: () => navigate(notification.link)
            } : undefined,
            duration: 5000,
          });

          // 3. Optional: Play sound
          // const audio = new Audio('/notification.mp3');
          // audio.play().catch(e => console.log("Audio play failed", e));
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient, navigate]);

  return null; // This component does not render anything visual itself
}
