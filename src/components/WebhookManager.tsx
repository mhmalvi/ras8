
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Webhook, Activity } from "lucide-react";

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered?: string;
  status: 'active' | 'inactive' | 'error';
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
}

interface WebhookActivity {
  id: string;
  webhookId: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  payload: any;
  response?: any;
  error?: string;
}

const WebhookManager = () => {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [activities, setActivities] = useState<WebhookActivity[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookName, setNewWebhookName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['orders/create']);
  const { toast } = useToast();

  const availableEvents = [
    'orders/create',
    'orders/updated', 
    'orders/cancelled',
    'returns/created',
    'returns/approved',
    'returns/completed',
    'app/uninstalled'
  ];

  useEffect(() => {
    loadWebhooks();
    loadActivities();
  }, []);

  const loadWebhooks = async () => {
    try {
      // Mock webhook data - in production this would come from database
      const mockWebhooks: WebhookEndpoint[] = [
        {
          id: '1',
          name: 'N8n Order Processing',
          url: 'https://n8n.yourserver.com/webhook/order-processing',
          events: ['orders/create', 'orders/updated'],
          active: true,
          lastTriggered: new Date().toISOString(),
          status: 'active',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        {
          id: '2',
          name: 'N8n Return Workflow',
          url: 'https://n8n.yourserver.com/webhook/return-workflow',
          events: ['returns/created', 'returns/approved'],
          active: true,
          status: 'active',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        {
          id: '3',
          name: 'App Lifecycle Handler',
          url: 'https://n8n.yourserver.com/webhook/app-lifecycle',
          events: ['app/uninstalled'],
          active: false,
          status: 'inactive',
          method: 'POST'
        }
      ];
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      toast({
        title: "Error",
        description: "Failed to load webhooks",
        variant: "destructive",
      });
    }
  };

  const loadActivities = () => {
    // Mock activity data
    const mockActivities: WebhookActivity[] = [
      {
        id: '1',
        webhookId: '1',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        status: 'success',
        payload: { event: 'orders/create', order_id: '12345' }
      },
      {
        id: '2',
        webhookId: '2',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'success',
        payload: { event: 'returns/created', return_id: 'ret_789' }
      },
      {
        id: '3',
        webhookId: '1',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'error',
        payload: { event: 'orders/updated', order_id: '12346' },
        error: 'Connection timeout'
      }
    ];
    setActivities(mockActivities);
  };

  const toggleWebhook = async (webhookId: string, active: boolean) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === webhookId 
            ? { ...webhook, active, status: active ? 'active' : 'inactive' as const }
            : webhook
        )
      );

      toast({
        title: "Webhook updated",
        description: `Webhook ${active ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update webhook status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhookUrl || !newWebhookName) {
      toast({
        title: "Error",
        description: "Please enter both webhook name and URL.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedEvents.length) {
      toast({
        title: "Error", 
        description: "Please select at least one event.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newWebhook: WebhookEndpoint = {
        id: Date.now().toString(),
        name: newWebhookName,
        url: newWebhookUrl,
        events: [...selectedEvents],
        active: true,
        status: 'active',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      setWebhooks(prev => [...prev, newWebhook]);
      setNewWebhookUrl('');
      setNewWebhookName('');
      setSelectedEvents(['orders/create']);

      toast({
        title: "Webhook created",
        description: "New webhook endpoint has been configured successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create webhook.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (webhook: WebhookEndpoint) => {
    setLoading(true);
    try {
      // Create test payload
      const testPayload = {
        event: webhook.events[0],
        timestamp: new Date().toISOString(),
        test: true,
        data: {
          id: 'test_' + Date.now(),
          type: 'webhook_test'
        }
      };

      console.log('Testing webhook:', webhook.url, 'with payload:', testPayload);

      // Simulate HTTP request to n8n webhook
      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        // Add successful test activity
        const newActivity: WebhookActivity = {
          id: Date.now().toString(),
          webhookId: webhook.id,
          timestamp: new Date().toISOString(),
          status: 'success',
          payload: testPayload,
          response: await response.text()
        };
        setActivities(prev => [newActivity, ...prev]);

        toast({
          title: "Test successful",
          description: "Webhook test completed successfully.",
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
      
      // Add failed test activity
      const failedActivity: WebhookActivity = {
        id: Date.now().toString(),
        webhookId: webhook.id,
        timestamp: new Date().toISOString(),
        status: 'error',
        payload: { test: true },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setActivities(prev => [failedActivity, ...prev]);

      toast({
        title: "Test failed",
        description: `Webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      setActivities(prev => prev.filter(a => a.webhookId !== webhookId));
      
      toast({
        title: "Webhook deleted",
        description: "Webhook has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            N8n Webhook Endpoints
          </CardTitle>
          <CardDescription>
            Manage webhook endpoints for automated workflow processing via HTTP requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{webhook.name}</h4>
                  <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                    {webhook.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {webhook.method}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">{webhook.url}</p>
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map(event => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>
                {webhook.lastTriggered && (
                  <p className="text-xs text-muted-foreground">
                    Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhook.active}
                  onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                  disabled={loading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook(webhook)}
                  disabled={loading}
                >
                  Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteWebhook(webhook.id)}
                  disabled={loading}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New N8n Webhook</CardTitle>
          <CardDescription>
            Configure a new webhook endpoint for n8n workflow automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-name">Webhook Name</Label>
              <Input
                id="webhook-name"
                type="text"
                placeholder="My N8n Workflow"
                value={newWebhookName}
                onChange={(e) => setNewWebhookName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">N8n Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://n8n.yourserver.com/webhook/workflow-name"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Event Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableEvents.map(event => (
                <label key={event} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEvents(prev => [...prev, event]);
                      } else {
                        setSelectedEvents(prev => prev.filter(ev => ev !== event));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={createWebhook} disabled={loading} className="w-full">
            <Webhook className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create N8n Webhook'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Webhook Activity Log
          </CardTitle>
          <CardDescription>
            Real-time HTTP request activity and responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No webhook activity yet
              </p>
            ) : (
              activities.map((activity) => {
                const webhook = webhooks.find(w => w.id === activity.webhookId);
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-500' : 
                      activity.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {webhook?.name || 'Unknown Webhook'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Event: <code className="text-xs bg-muted px-1 rounded">
                          {activity.payload.event || 'unknown'}
                        </code>
                      </div>
                      {activity.error && (
                        <div className="text-sm text-red-600">
                          Error: {activity.error}
                        </div>
                      )}
                      {activity.status === 'success' && (
                        <div className="text-sm text-green-600">
                          ✓ Successfully processed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManager;
