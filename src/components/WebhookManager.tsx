
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Webhook, Activity, Settings, AlertCircle } from "lucide-react";

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered?: string;
  status: 'active' | 'inactive' | 'error';
}

const WebhookManager = () => {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = () => {
    // Mock webhook data - in production this would come from Shopify API
    const mockWebhooks: WebhookEndpoint[] = [
      {
        id: '1',
        name: 'Orders Webhook',
        url: 'https://pvadajelvewdazwmvppk.supabase.co/functions/v1/shopify-webhook',
        events: ['orders/create', 'orders/updated', 'orders/cancelled'],
        active: true,
        lastTriggered: new Date().toISOString(),
        status: 'active'
      },
      {
        id: '2',
        name: 'App Lifecycle Webhook',
        url: 'https://pvadajelvewdazwmvppk.supabase.co/functions/v1/shopify-webhook',
        events: ['app/uninstalled'],
        active: true,
        status: 'active'
      }
    ];
    setWebhooks(mockWebhooks);
  };

  const toggleWebhook = async (webhookId: string, active: boolean) => {
    setLoading(true);
    try {
      // In production, this would make an API call to Shopify
      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === webhookId 
            ? { ...webhook, active }
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
    if (!newWebhookUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // In production, this would create a webhook via Shopify API
      const newWebhook: WebhookEndpoint = {
        id: Date.now().toString(),
        name: 'Custom Webhook',
        url: newWebhookUrl,
        events: ['orders/create'],
        active: true,
        status: 'active'
      };

      setWebhooks(prev => [...prev, newWebhook]);
      setNewWebhookUrl('');

      toast({
        title: "Webhook created",
        description: "New webhook endpoint has been configured.",
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

  const testWebhook = async (webhookId: string) => {
    setLoading(true);
    try {
      // Mock test webhook call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Test successful",
        description: "Webhook test completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Test failed",
        description: "Webhook test failed. Please check the endpoint.",
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
            Webhook Endpoints
          </CardTitle>
          <CardDescription>
            Manage webhook endpoints for real-time event processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{webhook.name}</h4>
                  <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                    {webhook.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{webhook.url}</p>
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
                  onClick={() => testWebhook(webhook.id)}
                  disabled={loading}
                >
                  Test
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Webhook</CardTitle>
          <CardDescription>
            Configure a new webhook endpoint for event processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-endpoint.com/webhook"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
            />
          </div>
          <Button onClick={createWebhook} disabled={loading}>
            <Webhook className="h-4 w-4 mr-2" />
            Create Webhook
          </Button>
        </CardCard>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Webhook Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Order created webhook - 2 minutes ago</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Return processed webhook - 5 minutes ago</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Order updated webhook - 10 minutes ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManager;
