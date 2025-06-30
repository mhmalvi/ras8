
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, X, Check, AlertTriangle, Info, TrendingUp } from 'lucide-react';

interface Notification {
  id: string;
  type: 'return' | 'ai' | 'system' | 'usage';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'return',
      title: 'New Return Request',
      message: 'Customer John Doe requested return for Order #12345',
      timestamp: '2 minutes ago',
      read: false,
      action: {
        label: 'Review',
        onClick: () => console.log('Review return')
      }
    },
    {
      id: '2',
      type: 'ai',
      title: 'AI Suggestion Available',
      message: 'High confidence exchange suggestion for returned item (94% match)',
      timestamp: '15 minutes ago',
      read: false,
      action: {
        label: 'View',
        onClick: () => console.log('View AI suggestion')
      }
    },
    {
      id: '3',
      type: 'usage',
      title: 'Usage Alert',
      message: 'You\'ve used 85% of your monthly return limit (425/500)',
      timestamp: '1 hour ago',
      read: true
    },
    {
      id: '4',
      type: 'system',
      title: 'System Update',
      message: 'New AI model deployed with improved accuracy',
      timestamp: '2 hours ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'return': return <Bell className="h-4 w-4 text-blue-600" />;
      case 'ai': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'usage': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'system': return <Info className="h-4 w-4 text-slate-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Notifications</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="space-y-1 p-4 pt-0">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative p-3 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-slate-50 border-slate-200' 
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          notification.read ? 'text-slate-700' : 'text-slate-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={() => removeNotification(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className={`text-sm mt-1 ${
                        notification.read ? 'text-slate-500' : 'text-slate-600'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">
                          {notification.timestamp}
                        </span>
                        <div className="flex items-center gap-2">
                          {notification.action && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={notification.action.onClick}
                            >
                              {notification.action.label}
                            </Button>
                          )}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
