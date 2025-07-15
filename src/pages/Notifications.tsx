
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAtomicAuth } from "@/contexts/AtomicAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'return' | 'ai_suggestion' | 'system' | 'billing';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

const Notifications = () => {
  const { user } = useAtomicAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    returnAlerts: true,
    aiSuggestions: true,
    systemUpdates: false,
    billingAlerts: true
  });

  useEffect(() => {
    // Generate sample notifications based on real data patterns
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        type: 'return',
        title: 'New Return Request',
        message: 'Customer John Doe requested return for Order #12345',
        read: false,
        created_at: new Date(Date.now() - 2 * 60000).toISOString(),
        priority: 'high'
      },
      {
        id: '2',
        type: 'ai_suggestion',
        title: 'AI Suggestion Available',
        message: 'High confidence exchange suggestion for returned item (94% match)',
        read: false,
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
        priority: 'medium'
      },
      {
        id: '3',
        type: 'billing',
        title: 'Usage Alert',
        message: "You've used 85% of your monthly return limit (425/500)",
        read: true,
        created_at: new Date(Date.now() - 60 * 60000).toISOString(),
        priority: 'medium'
      },
      {
        id: '4',
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance completed successfully',
        read: true,
        created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        priority: 'low'
      }
    ];
    setNotifications(sampleNotifications);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'return': return <Bell className="h-4 w-4" />;
      case 'ai_suggestion': return <Info className="h-4 w-4" />;
      case 'system': return <CheckCircle className="h-4 w-4" />;
      case 'billing': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppLayout 
      title="Notifications" 
      description="Manage notification settings and view recent alerts"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Recent Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} new</Badge>
            )}
          </div>
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </div>

        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`transition-colors ${!notification.read ? 'border-blue-200 bg-blue-50/50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-full ${notification.type === 'return' ? 'bg-blue-100 text-blue-600' : 
                      notification.type === 'ai_suggestion' ? 'bg-purple-100 text-purple-600' :
                      notification.type === 'billing' ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                          {notification.priority}
                        </Badge>
                        {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                        Mark read
                      </Button>
                    )}
                    {notification.type === 'return' && (
                      <Button size="sm">Review</Button>
                    )}
                    {notification.type === 'ai_suggestion' && (
                      <Button size="sm" variant="outline">View</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch 
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({...prev, emailNotifications: checked}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Return Alerts</h4>
                  <p className="text-sm text-muted-foreground">Get notified of new return requests</p>
                </div>
                <Switch 
                  checked={settings.returnAlerts}
                  onCheckedChange={(checked) => setSettings(prev => ({...prev, returnAlerts: checked}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">AI Suggestions</h4>
                  <p className="text-sm text-muted-foreground">Notifications for AI-powered recommendations</p>
                </div>
                <Switch 
                  checked={settings.aiSuggestions}
                  onCheckedChange={(checked) => setSettings(prev => ({...prev, aiSuggestions: checked}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Billing Alerts</h4>
                  <p className="text-sm text-muted-foreground">Usage limits and billing notifications</p>
                </div>
                <Switch 
                  checked={settings.billingAlerts}
                  onCheckedChange={(checked) => setSettings(prev => ({...prev, billingAlerts: checked}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">System Updates</h4>
                  <p className="text-sm text-muted-foreground">Platform updates and maintenance notices</p>
                </div>
                <Switch 
                  checked={settings.systemUpdates}
                  onCheckedChange={(checked) => setSettings(prev => ({...prev, systemUpdates: checked}))}
                />
              </div>
            </div>

            <Button className="w-full">Save Notification Settings</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Notifications;
