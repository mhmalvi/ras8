
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Webhook, Activity, CheckCircle, XCircle, AlertCircle, Copy, Trash2, Settings, Globe } from "lucide-react";
import { useMerchantWebhookManager } from '@/hooks/useMerchantWebhookManager';
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EnhancedWebhookManager = () => {
  const {
    webhooks,
    activities,
    loading,
    createWebhook,
    testWebhook,
    toggleWebhook,
    deleteWebhook,
    merchantId
  } = useMerchantWebhookManager();

  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookDescription, setNewWebhookDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['orders/create']);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const { toast } = useToast();

  const eventCategories = {
    'Orders': ['orders/create', 'orders/updated', 'orders/cancelled'],
    'Returns': ['returns/created', 'returns/approved', 'returns/completed'],
    'System': ['app/uninstalled']
  };

  const getStatusIcon = (status: 'active' | 'inactive' | 'error') => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl || !newWebhookName) {
      toast({
        title: "Validation Error",
        description: "Please provide both webhook name and URL.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedEvents.length) {
      toast({
        title: "Validation Error", 
        description: "Please select at least one event type.",
        variant: "destructive",
      });
      return;
    }

    // Generate merchant-specific webhook name
    const merchantSpecificName = `${newWebhookName}-${merchantId?.slice(0, 8)}`;

    const success = await createWebhook({
      name: merchantSpecificName,
      url: newWebhookUrl,
      events: [...selectedEvents],
      active: true,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Merchant-ID': merchantId || '',
        'X-Webhook-Source': 'returns-automation-saas'
      }
    });

    if (success) {
      setNewWebhookUrl('');
      setNewWebhookName('');
      setNewWebhookDescription('');
      setSelectedEvents(['orders/create']);
      setIsCreateFormOpen(false);
      toast({
        title: "Success",
        description: "Webhook endpoint created successfully with merchant isolation.",
      });
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard",
    });
  };

  const formatLastTriggered = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Merchant Context Alert */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          <strong>Tenant Isolation Active:</strong> All webhooks are scoped to your merchant ID: 
          <code className="bg-muted px-1 rounded text-xs ml-1">{merchantId?.slice(0, 8)}...</code>
        </AlertDescription>
      </Alert>

      {/* Active Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Active Webhook Endpoints
                <Badge variant="outline">{webhooks.length}</Badge>
              </CardTitle>
              <CardDescription>
                Manage your merchant-specific n8n workflow triggers
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
              variant={isCreateFormOpen ? "outline" : "default"}
            >
              {isCreateFormOpen ? "Cancel" : "Add Webhook"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(webhook.status)}
                    <h4 className="font-semibold">{webhook.name}</h4>
                    <Badge variant={webhook.active ? 'default' : 'secondary'}>
                      {webhook.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {webhook.method}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono break-all">
                      {webhook.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyWebhookUrl(webhook.url)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map(event => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last triggered: {formatLastTriggered(webhook.lastTriggered)}
                  </div>
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
                    disabled={loading || !webhook.active}
                  >
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteWebhook(webhook.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {webhooks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Webhook className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Webhooks Configured</h3>
              <p className="text-sm mb-4">Create your first merchant-specific webhook to start automating workflows</p>
              <Button onClick={() => setIsCreateFormOpen(true)}>
                Create First Webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Webhook Form */}
      {isCreateFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Webhook Endpoint</CardTitle>
            <CardDescription>
              Configure a new merchant-specific webhook for n8n workflow automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Webhook Name *</Label>
                <Input
                  id="webhook-name"
                  type="text"
                  placeholder="e.g., Order Processing Flow"
                  value={newWebhookName}
                  onChange={(e) => setNewWebhookName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Will be prefixed with your merchant ID for isolation
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">N8n Webhook URL *</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-n8n.com/webhook/endpoint-name"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-description">Description (Optional)</Label>
              <Textarea
                id="webhook-description"
                placeholder="Describe what this webhook does..."
                value={newWebhookDescription}
                onChange={(e) => setNewWebhookDescription(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-4">
              <Label>Event Types *</Label>
              {Object.entries(eventCategories).map(([category, events]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {events.map(event => (
                      <label key={event} className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-muted/50">
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
              ))}
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateFormOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateWebhook} 
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Webhook'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Webhook Activity Log
            <Badge variant="outline">{activities.length}</Badge>
          </CardTitle>
          <CardDescription>
            Real-time webhook execution history for your merchant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No webhook activity yet</p>
                <p className="text-sm">Webhook executions will appear here</p>
              </div>
            ) : (
              activities.map((activity) => {
                const webhook = webhooks.find(w => w.id === activity.webhookId);
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-500' : 
                      activity.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {webhook?.name || 'Unknown Webhook'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {activity.payload.event || 'unknown'}
                        </Badge>
                        {activity.status === 'success' && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            Success
                          </Badge>
                        )}
                        {activity.status === 'error' && (
                          <Badge variant="destructive" className="text-xs">
                            Failed
                          </Badge>
                        )}
                      </div>

                      {activity.error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <strong>Error:</strong> {activity.error}
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

export default EnhancedWebhookManager;
