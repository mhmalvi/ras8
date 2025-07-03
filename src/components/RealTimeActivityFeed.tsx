import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'webhook_triggered' | 'automation_executed' | 'n8n_workflow_started' | 'n8n_workflow_completed';
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
  webhookUrl?: string;
  workflowName?: string;
}

interface EventData {
  status?: string;
  webhook_url?: string;
  workflow_name?: string;
  ruleName?: string;
  error?: string;
  [key: string]: any;
}

const RealTimeActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
    setupRealTimeSubscription();
  }, []);

  const validateStatus = (status: string | undefined): 'success' | 'error' | 'pending' => {
    if (status === 'success' || status === 'error' || status === 'pending') {
      return status;
    }
    return 'pending';
  };

  const loadRecentActivity = async () => {
    try {
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .in('event_type', ['webhook_triggered', 'n8n_webhook_triggered', 'automation_test'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedActivities: ActivityEvent[] = events?.map(event => {
        const eventData = event.event_data as EventData;
        return {
          id: event.id,
          timestamp: event.created_at || new Date().toISOString(),
          type: event.event_type as any,
          status: validateStatus(eventData?.status),
          message: getActivityMessage(event.event_type, eventData),
          details: eventData,
          webhookUrl: eventData?.webhook_url,
          workflowName: eventData?.workflow_name || eventData?.ruleName
        };
      }) || [];

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: 'event_type=in.(webhook_triggered,n8n_webhook_triggered,automation_test)'
        },
        (payload) => {
          console.log('🔄 Real-time activity update:', payload);
          const newEvent = payload.new;
          const eventData = newEvent.event_data as EventData;
          
          const newActivity: ActivityEvent = {
            id: newEvent.id,
            timestamp: newEvent.created_at,
            type: newEvent.event_type,
            status: validateStatus(eventData?.status),
            message: getActivityMessage(newEvent.event_type, eventData),
            details: eventData,
            webhookUrl: eventData?.webhook_url,
            workflowName: eventData?.workflow_name || eventData?.ruleName
          };

          setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActivityMessage = (eventType: string, eventData: EventData | null) => {
    switch (eventType) {
      case 'webhook_triggered':
        return `Webhook triggered: ${eventData?.webhook_url || 'Unknown URL'}`;
      case 'n8n_webhook_triggered':
        return `n8n workflow "${eventData?.workflow_name || 'Unknown'}" executed`;
      case 'automation_test':
        return `Automation rule "${eventData?.ruleName || 'Unknown'}" tested`;
      default:
        return `${eventType} event occurred`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-Time Activity Feed
            </CardTitle>
            <CardDescription>
              Live updates of webhook triggers and automation executions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <Button variant="outline" size="sm" onClick={loadRecentActivity}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Loading activity...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-xs">Activity will appear here when webhooks are triggered</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  {getStatusIcon(activity.status)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    
                    {activity.workflowName && (
                      <p className="text-xs text-muted-foreground">
                        Workflow: <code className="bg-muted px-1 rounded">{activity.workflowName}</code>
                      </p>
                    )}
                    
                    {activity.details?.error && (
                      <p className="text-xs text-red-600">
                        Error: {activity.details.error}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={activity.status === 'success' ? 'default' : 
                                   activity.status === 'error' ? 'destructive' : 'secondary'} 
                             className="text-xs">
                        {activity.status}
                      </Badge>
                      
                      {activity.type && (
                        <Badge variant="outline" className="text-xs">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RealTimeActivityFeed;
