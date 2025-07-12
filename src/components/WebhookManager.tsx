
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
  merchantId: string;
}

interface WebhookActivity {
  id: string;
  webhookId: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  payload: any;
  response?: any;
  error?: string;
  merchantId: string;
}

import { useWebhookManager } from '@/hooks/useWebhookManager';

const WebhookManager = () => {
  const {
    webhooks,
    activities,
    loading,
    createWebhook,
    testWebhook,
    toggleWebhook,
    deleteWebhook
  } = useWebhookManager();

  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookName, setNewWebhookName] = useState('');
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

  const handleCreateWebhook = async () => {
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

    const success = await createWebhook({
      name: newWebhookName,
      url: newWebhookUrl,
      events: [...selectedEvents],
      active: true,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (success) {
      setNewWebhookUrl('');
      setNewWebhookName('');
      setSelectedEvents(['orders/create']);
    }
  };

  const handleTestWebhook = async (webhook: WebhookEndpoint) => {
    // Ensure merchantId is present before testing
    if (!webhook.merchantId) {
      toast({
        title: "Error",
        description: "Cannot test webhook: missing merchant ID",
        variant: "destructive",
      });
      return;
    }
    await testWebhook(webhook);
  };

  const handleToggleWebhook = async (webhookId: string, active: boolean) => {
    await toggleWebhook(webhookId, active);
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    await deleteWebhook(webhookId);
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
                  onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                  disabled={loading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestWebhook(webhook)}
                  disabled={loading}
                >
                  {loading ? 'Testing...' : 'Test'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  disabled={loading}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {webhooks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No webhooks configured yet</p>
              <p className="text-sm">Create your first webhook below</p>
            </div>
          )}
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

          <Button onClick={handleCreateWebhook} disabled={loading} className="w-full">
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
