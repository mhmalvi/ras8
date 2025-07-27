import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';

interface WebhookEndpoint {
  id: string;
  name: string;
  webhook_url: string;
  webhook_type: string;
  events: string[];
  active: boolean;
  created_at: string;
}

const WebhookEndpointManager = () => {
  const { toast } = useToast();
  const { profile } = useMerchantProfile();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    webhook_url: '',
    webhook_type: 'n8n',
    events: ['return_created', 'return_updated']
  });

  const loadEndpoints = async () => {
    if (!profile?.merchant_id) return;

    try {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEndpoints(data || []);
    } catch (error) {
      console.error('Error loading webhook endpoints:', error);
      toast({
        title: "Error",
        description: "Failed to load webhook endpoints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEndpoint = async () => {
    if (!profile?.merchant_id) return;

    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .insert({
          merchant_id: profile.merchant_id,
          ...newEndpoint
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Webhook endpoint created successfully",
      });

      setNewEndpoint({
        name: '',
        webhook_url: '',
        webhook_type: 'n8n',
        events: ['return_created', 'return_updated']
      });
      setShowAddForm(false);
      loadEndpoints();
    } catch (error) {
      console.error('Error creating webhook endpoint:', error);
      toast({
        title: "Error",
        description: "Failed to create webhook endpoint",
        variant: "destructive",
      });
    }
  };

  const toggleEndpoint = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
      loadEndpoints();
    } catch (error) {
      console.error('Error updating webhook endpoint:', error);
      toast({
        title: "Error",
        description: "Failed to update webhook endpoint",
        variant: "destructive",
      });
    }
  };

  const deleteEndpoint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Webhook endpoint deleted successfully",
      });
      
      loadEndpoints();
    } catch (error) {
      console.error('Error deleting webhook endpoint:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook endpoint",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadEndpoints();
  }, [profile?.merchant_id]);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading webhook endpoints...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Endpoint
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Webhook Endpoint</CardTitle>
            <CardDescription>
              Configure a webhook endpoint to receive real-time notifications about returns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newEndpoint.name}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                placeholder="e.g., n8n Returns Automation"
              />
            </div>
            
            <div>
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                value={newEndpoint.webhook_url}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, webhook_url: e.target.value })}
                placeholder="https://your-n8n-instance.com/webhook/..."
              />
            </div>

            <div>
              <Label htmlFor="webhook_type">Type</Label>
              <Select
                value={newEndpoint.webhook_type}
                onValueChange={(value) => setNewEndpoint({ ...newEndpoint, webhook_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="n8n">n8n</SelectItem>
                  <SelectItem value="zapier">Zapier</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button onClick={createEndpoint} disabled={!newEndpoint.name || !newEndpoint.webhook_url}>
                Create Endpoint
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {endpoints.map((endpoint) => (
          <Card key={endpoint.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{endpoint.name}</h4>
                    <Badge variant={endpoint.webhook_type === 'n8n' ? 'default' : 'secondary'}>
                      {endpoint.webhook_type}
                    </Badge>
                    <Badge variant={endpoint.active ? 'default' : 'secondary'}>
                      {endpoint.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{endpoint.webhook_url}</span>
                    <a href={endpoint.webhook_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <div className="flex space-x-2">
                    {endpoint.events.map((event) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={endpoint.active}
                    onCheckedChange={(checked) => toggleEndpoint(endpoint.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteEndpoint(endpoint.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {endpoints.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No webhook endpoints configured. Add one to start receiving notifications.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WebhookEndpointManager;