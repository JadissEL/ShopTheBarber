import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Bell, Check, X, AlertCircle, CheckCircle, Star } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        loadUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-moroccan-green" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-moroccan-gold" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Star className="h-5 w-5 text-moroccan-royal-blue" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey to-moroccan-charcoal border-moroccan-gold/20 shadow-moroccan-xl">
        <DialogHeader className="relative">
          {/* Moroccan Pattern Background */}
          <div className="absolute inset-0 opacity-5">
            <div className="moroccan-pattern"></div>
          </div>
          
          <DialogTitle className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-lg shadow-moroccan">
                <Bell className="h-5 w-5 text-moroccan-charcoal" />
              </div>
              <span className="text-moroccan-offwhite font-heading text-xl">Notifications</span>
            </div>
            {unreadCount > 0 && (
              <div className="relative">
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-moroccan-gold rounded-full animate-moroccan-pulse"></div>
                <div className="px-3 py-1 bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal text-sm font-bold rounded-full shadow-moroccan">
                  {unreadCount.toString()}
                </div>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 relative z-10">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="w-full bg-gradient-to-r from-moroccan-green/10 to-moroccan-gold/10 border-moroccan-green/30 text-moroccan-green hover:from-moroccan-green/20 hover:to-moroccan-gold/20 hover:border-moroccan-green/50 transition-all duration-300 shadow-moroccan"
            >
              <Check className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-moroccan-gold/20 border-t-moroccan-gold rounded-full animate-spin mx-auto"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-moroccan-green rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
                </div>
                <p className="mt-4 text-moroccan-offwhite/70 font-medium">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-moroccan-gold/20 to-moroccan-green/20 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="h-8 w-8 text-moroccan-gold" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-moroccan-pattern opacity-20"></div>
                </div>
                <p className="text-moroccan-offwhite/60 font-medium">Aucune notification</p>
                <p className="text-moroccan-offwhite/40 text-sm mt-2">Vous êtes à jour !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-moroccan-lg transform hover:-translate-y-1 ${
                      notification.is_read 
                        ? 'bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/10' 
                        : 'bg-gradient-to-r from-moroccan-gold/10 to-moroccan-green/10 border-moroccan-gold/30 shadow-moroccan'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Moroccan Pattern Overlay */}
                    <div className="absolute inset-0 opacity-5 rounded-xl overflow-hidden">
                      <div className="moroccan-pattern"></div>
                    </div>
                    
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-2 rounded-lg ${
                          notification.is_read 
                            ? 'bg-moroccan-darkgrey/50' 
                            : 'bg-gradient-to-br from-moroccan-gold/20 to-moroccan-green/20'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-heading text-base ${
                            notification.is_read ? 'text-moroccan-offwhite/70' : 'text-moroccan-offwhite'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-2 leading-relaxed ${
                            notification.is_read ? 'text-moroccan-offwhite/50' : 'text-moroccan-offwhite/80'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-3">
                            <div className="w-2 h-2 bg-moroccan-gold rounded-full mr-2"></div>
                            <p className="text-xs text-moroccan-offwhite/40 font-medium">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="ml-3 p-2 bg-gradient-to-r from-moroccan-green/20 to-moroccan-gold/20 hover:from-moroccan-green/30 hover:to-moroccan-gold/30 border border-moroccan-green/30 hover:border-moroccan-green/50 transition-all duration-300 rounded-lg opacity-0 group-hover:opacity-100"
                        >
                          <Check className="h-4 w-4 text-moroccan-green" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Unread Indicator */}
                    {!notification.is_read && (
                      <div className="absolute top-3 right-3 w-2 h-2 bg-moroccan-gold rounded-full animate-moroccan-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
} 