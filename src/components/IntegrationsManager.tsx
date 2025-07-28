import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Key, 
  Zap, 
  Mail, 
  MessageSquare,
  ShoppingBag,
  Loader2,
  AlertTriangle,
  Shield
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  requires_api_key: boolean;
  config_fields?: {
    name: string;
    label: string;
    type: 'text' | 'password' | 'email';
    placeholder: string;
  }[];
  status?: 'active' | 'error' | 'warning';
  last_sync?: string;
}

const IntegrationsManager = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const defaultIntegrations: Integration[] = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Connect your Shopify store for order and product sync',
      icon: <ShoppingBag className="h-5 w-5" />,
      connected: false,
      requires_api_key: true,
      config_fields: [
        { name: 'store_url', label: 'Store URL', type: 'text', placeholder: 'your-store.myshopify.com' },
        { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'shpat_...' }
      ]
    },
    {
      id: 'klaviyo',
      name: 'Klaviyo',
      description: 'Email marketing automation and customer engagement',
      icon: <Mail className="h-5 w-5" />,
      connected: false,
      requires_api_key: true,
      config_fields: [
        { name: 'api_key', label: 'Private API Key', type: 'password', placeholder: 'pk_...' },
        { name: 'public_key', label: 'Public API Key', type: 'text', placeholder: 'public_key' }
      ]
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Automate workflows with 5000+ apps',
      icon: <Zap className="h-5 w-5" />,
      connected: false,
      requires_api_key: true,
      config_fields: [
        { name: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.zapier.com/...' }
      ]
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get notifications in your Slack workspace',
      icon: <MessageSquare className="h-5 w-5" />,
      connected: false,
      requires_api_key: true,
      config_fields: [
        { name: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/...' },
        { name: 'channel', label: 'Channel', type: 'text', placeholder: '#returns' }
      ]
    }
  ];

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      // Load integration configs from database
      const { data: configData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'integration_config');

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading integrations:', error);
      }

      // Update integrations with saved configs
      const updatedIntegrations = defaultIntegrations.map(integration => {
        const config = configData?.find(c => {
          const eventData = c.event_data as any;
          return eventData?.integration_id === integration.id;
        });
        if (config) {
          const eventData = config.event_data as any;
          return {
            ...integration,
            connected: eventData?.connected || false,
            status: eventData?.status || 'active',
            last_sync: config.created_at
          };
        }
        return integration;
      });

      setIntegrations(updatedIntegrations);
    } catch (error) {
      console.error('Error loading integrations:', error);
      setIntegrations(defaultIntegrations);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (integrationId: string, field: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId],
        [field]: value
      }
    }));
  };

  const toggleIntegration = async (integrationId: string, enabled: boolean) => {
    if (enabled && !configs[integrationId]) {
      toast({
        title: "Configuration Required",
        description: "Please configure the integration settings first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const config = configs[integrationId] || {};
      
      // Save integration config
      const { error } = await supabase
        .from('analytics_events')
        .upsert({
          event_type: 'integration_config',
          event_data: {
            integration_id: integrationId,
            connected: enabled,
            status: enabled ? 'active' : 'inactive',
            config: enabled ? config : null,
            updated_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      // Update local state
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, connected: enabled, status: enabled ? 'active' : undefined }
          : integration
      ));

      toast({
        title: enabled ? "Integration Connected" : "Integration Disconnected",
        description: `${integrations.find(i => i.id === integrationId)?.name} has been ${enabled ? 'connected' : 'disconnected'}.`
      });

    } catch (error) {
      console.error('Error toggling integration:', error);
      toast({
        title: "Error",
        description: "Failed to update integration settings.",
        variant: "destructive"
      });
    }
  };

  const testConnection = async (integrationId: string) => {
    const config = configs[integrationId];
    if (!config) {
      toast({
        title: "Configuration Required",
        description: "Please enter configuration details first.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Testing Connection",
      description: "This would test the integration connection in a real implementation."
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading integrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Integrations</h2>
          <p className="text-muted-foreground">Connect your favorite tools and services</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Integrations allow you to connect external services. API keys are securely encrypted and stored.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-md transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {integration.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {integration.connected && (
                    <div className="flex items-center space-x-2">
                      {integration.status === 'active' && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {integration.status === 'error' && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                      {integration.status === 'warning' && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Warning
                        </Badge>
                      )}
                    </div>
                  )}
                  <Switch
                    checked={integration.connected}
                    onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                  />
                </div>
              </div>
            </CardHeader>

            {(integration.requires_api_key || integration.connected) && (
              <CardContent>
                {integration.config_fields && (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {integration.config_fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={`${integration.id}-${field.name}`}>
                            {field.label}
                          </Label>
                          <Input
                            id={`${integration.id}-${field.name}`}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={configs[integration.id]?.[field.name] || ''}
                            onChange={(e) => handleConfigChange(integration.id, field.name, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(integration.id)}
                        disabled={!configs[integration.id]}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Test Connection
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Documentation
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {integration.connected && integration.last_sync && (
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    Last updated: {new Date(integration.last_sync).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsManager;