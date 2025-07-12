
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Webhook, 
  Plus, 
  TestTube, 
  Activity, 
  Shield, 
  Trash2, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { useMerchantWebhookManager } from "@/hooks/useMerchantWebhookManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WebhookTestDialog from './WebhookTestDialog';

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

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['orders/create', 'orders/updated'],
    method: 'POST' as 'POST' | 'GET',
    active: true
  });

  const { toast } = useToast();

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const success = await createWebhook(newWebhook);
    if (success) {
      setShowCreateDialog(false);
      setNewWebhook({
        name: '',
        url: '',
        events: ['orders/create', 'orders/updated'],
        method: 'POST',
        active: true
      });
    }
  };

  const getActivityStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!merchantId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading merchant configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with isolation info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                <Shield className="h-4 w-4 text-green-600" />
                Merchant Webhook Manager
              </CardTitle>
              <CardDescription>
                Manage your merchant-specific webhook endpoints with full tenant isolation
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Webhook</DialogTitle>
                  <DialogDescription>
                    Add a new webhook endpoint for your merchant workflows
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-name">Webhook Name *</Label>
                    <Input
                      id="webhook-name"
                      placeholder="e.g., Order Processing Webhook"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL *</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      placeholder="https://your-n8n.com/webhook/endpoint"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook-method">HTTP Method</Label>
                    <Select
                      value={newWebhook.method}
                      onValueChange={(value: 'POST' | 'GET') => 
                        setNewWebhook({ ...newWebhook, method: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST (Recommended)</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      POST is recommended for receiving JSON payloads
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="webhook-active"
                      checked={newWebhook.active}
                      onCheckedChange={(checked) => setNewWebhook({ ...newWebhook, active: checked })}
                    />
                    <Label htmlFor="webhook-active">Active</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateWebhook} disabled={loading}>
                      {loading ? 'Creating...' : 'Create Webhook'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tenant isolation info */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <Shield className="text-green-600 mt-1 h-4 w-4" />
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-2">✅ Tenant Isolation Active</p>
                <div className="space-y-1 text-green-700">
                  <p><strong>Your Merchant ID:</strong> <code className="bg-green-100 px-1 rounded text-xs">{merchantId}</code></p>
                  <p><strong>Data Scope:</strong> All webhooks are scoped to your merchant ID: {merchantId}</p>
                  <p><strong>Security:</strong> Your webhook configurations are completely isolated from other merchants</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Webhook Endpoints
            <Badge variant="outline">{webhooks.length}</Badge>
          </CardTitle>
          <CardDescription>
            Manage your merchant-specific webhook endpoints and test configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground mb-4">
                Create your first webhook endpoint to start receiving automation events
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{webhook.name}</h3>
                        <Badge variant={webhook.active ? 'default' : 'secondary'}>
                          {webhook.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {webhook.method}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {webhook.url}
                        </p>
                        <p>Events: {webhook.events.join(', ')}</p>
                        {webhook.lastTriggered && (
                          <p>Last triggered: {formatTimestamp(webhook.lastTriggered)}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <WebhookTestDialog
                        webhook={webhook}
                        onTest={testWebhook}
                        isLoading={loading}
                      />
                      <Switch
                        checked={webhook.active}
                        onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                        disabled={loading}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteWebhook(webhook.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Activity Log */}
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
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No webhook activity yet</h3>
              <p className="text-muted-foreground">
                Webhook executions and tests will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getActivityStatusIcon(activity.status)}
                    <div>
                      <p className="font-medium text-sm">
                        Webhook {activity.status === 'success' ? 'executed successfully' : 
                                activity.status === 'error' ? 'execution failed' : 'pending'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                      {activity.error && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {activity.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      ID: {activity.webhookId}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">🔧 n8n Webhook Setup</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Set your n8n webhook node to <strong>POST</strong> method to receive JSON payloads</p>
              <p>• Use the webhook URLs provided in the n8n Setup tab</p>
              <p>• Include your merchant ID parameter: <code>?merchant={merchantId}</code></p>
              <p>• Test webhooks send comprehensive payload data for validation</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">CORS & Browser Limitations</p>
                <p className="text-amber-700">
                  Due to browser security, we cannot verify webhook responses. 
                  Check your n8n execution history to confirm webhook receipt.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedWebhookManager;
