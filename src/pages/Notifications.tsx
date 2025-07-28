import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bell, Settings, Filter, CheckCheck, X, Info, AlertTriangle, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/useNotifications';
import AppLayout from '@/components/AppLayout';

const Notifications = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('all');
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    returnUpdates: true,
    aiSuggestions: true,
    systemUpdates: false,
    billingAlerts: true
  });

  // Get filter object for the hook
  const getFilterObject = () => {
    switch (filter) {
      case 'unread':
        return { read: false };
      case 'high':
        return { priority: 'high' as const };
      case 'medium':
        return { priority: 'medium' as const };
      case 'low':
        return { priority: 'low' as const };
      case 'returns':
        return { type: 'return' };
      case 'ai':
        return { type: 'ai_suggestion' };
      case 'billing':
        return { type: 'billing' };
      case 'system':
        return { type: 'system' };
      default:
        return {};
    }
  };

  const { 
    notifications, 
    loading, 
    error, 
    counts, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(getFilterObject());

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'return': return <Bell className="h-4 w-4" />;
      case 'ai_suggestion': return <Info className="h-4 w-4" />;
      case 'billing': return <DollarSign className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'return': return 'bg-blue-100 text-blue-600';
      case 'ai_suggestion': return 'bg-purple-100 text-purple-600';
      case 'billing': return 'bg-green-100 text-green-600';
      case 'system': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // Filtering is now handled by the hook based on filter state
  const filteredNotifications = notifications;
  const unreadCount = counts.unread;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with returns, AI suggestions, and system alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-3 py-1">
              {unreadCount} unread
            </Badge>
          )}
          <Button
            onClick={() => markAllAsRead()}
            variant="outline"
            disabled={unreadCount === 0 || loading}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{counts.total}</p>
              </div>
              <Bell className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{counts.unread}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{counts.high}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">AI Suggestions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {notifications.filter(n => n.type === 'ai_suggestion').length}
                </p>
              </div>
              <Info className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filter by:</span>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All notifications</SelectItem>
                <SelectItem value="unread">Unread only</SelectItem>
                <Separator />
                <SelectItem value="high">High priority</SelectItem>
                <SelectItem value="medium">Medium priority</SelectItem>
                <SelectItem value="low">Low priority</SelectItem>
                <Separator />
                <SelectItem value="returns">Returns</SelectItem>
                <SelectItem value="ai">AI suggestions</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {/* Debug info */}
        <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded">
          Debug: {notifications.length} notifications, Filter: {filter}, Loading: {loading ? 'yes' : 'no'}
        </div>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Error loading notifications</p>
              <p className="text-sm text-slate-500">{error}</p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No notifications found</p>
              <p className="text-sm text-slate-500 mt-2">
                {filter === 'all' 
                  ? "You're all caught up! New notifications will appear here."
                  : "No notifications match your current filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Force show notifications for debugging */}
            <div className="text-sm bg-yellow-50 p-3 mb-4 rounded">
              Showing {filteredNotifications.length} notifications. Raw data:
              <pre className="text-xs mt-2">{JSON.stringify(filteredNotifications.slice(0, 2), null, 2)}</pre>
            </div>
            {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-colors hover:shadow-md ${
                !notification.read ? 'ring-1 ring-blue-200 bg-blue-50/30' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icon */}
                    <div className={`p-3 rounded-full ${getTypeColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                        <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-slate-600 leading-relaxed">{notification.message}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <CheckCheck className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </>
        )}
      </div>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-slate-500 mt-1">Receive notifications via email</p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Return Updates</Label>
                  <p className="text-xs text-slate-500 mt-1">Get notified about return status changes</p>
                </div>
                <Switch
                  checked={preferences.returnUpdates}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, returnUpdates: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">AI Suggestions</Label>
                  <p className="text-xs text-slate-500 mt-1">Notifications for AI recommendations</p>
                </div>
                <Switch
                  checked={preferences.aiSuggestions}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, aiSuggestions: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Billing Alerts</Label>
                  <p className="text-xs text-slate-500 mt-1">Usage limits and billing notifications</p>
                </div>
                <Switch
                  checked={preferences.billingAlerts}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, billingAlerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">System Updates</Label>
                  <p className="text-xs text-slate-500 mt-1">Platform updates and maintenance notices</p>
                </div>
                <Switch
                  checked={preferences.systemUpdates}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, systemUpdates: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <p className="text-xs text-slate-500 mt-1">Browser push notifications</p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              className="w-full md:w-auto cursor-pointer"
              onClick={() => {
                toast({
                  title: "Preferences Saved",
                  description: "Your notification settings have been updated",
                });
              }}
            >
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
};

export default Notifications;