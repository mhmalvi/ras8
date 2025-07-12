import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, Server, CheckCircle, XCircle, Copy, ExternalLink } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const N8nConnectionSetup = () => {
  const [n8nUrl, setN8nUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [loading, setLoading] = useState(false);
  const [setupInstructions, setSetupInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const { data: configs, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'n8n_configuration')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading n8n config:', error);
        return;
      }

      if (configs && configs.length > 0 && configs[0].event_data) {
        const configData = configs[0].event_data as any;
        setN8nUrl(configData.n8n_url || '');
        setApiKey(configData.api_key || '');
        setWebhookSecret(configData.webhook_secret || '');
        setConnectionStatus(configData.connection_verified ? 'connected' : 'disconnected');
        console.log('✅ n8n configuration loaded');
      }
    } catch (error) {
      console.error('Error loading n8n configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!n8nUrl) {
      toast({
        title: "Error",
        description: "Please enter your n8n server URL first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { n8nService } = await import('@/services/n8nService');
      const result = await n8nService.testConnection(n8nUrl, apiKey);
      
      if (result.success) {
        setConnectionStatus('connected');
        
        // Save successful configuration
        await saveConfigurationToDatabase(true);

        toast({
          title: "Connection test completed",
          description: result.data?.message || "Test requests sent to n8n webhooks successfully.",
        });

        // Show additional info about CORS limitations
        toast({
          title: "Important Note",
          description: "Due to browser security (CORS), we cannot verify if n8n received the requests. Please check your n8n workflow execution history to confirm.",
          variant: "default",
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Connection test failed",
          description: result.error || "Failed to connect to n8n server",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "Connection test failed",
        description: "Unable to reach n8n server. Please check the URL and ensure n8n is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!n8nUrl) {
      toast({
        title: "Error",
        description: "Please enter your n8n server URL.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await saveConfigurationToDatabase(false);
      toast({
        title: "Configuration saved",
        description: "n8n configuration has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save n8n configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfigurationToDatabase = async (verified: boolean = false) => {
    const configData = {
      n8n_url: n8nUrl,
      api_key: apiKey,
      webhook_secret: webhookSecret,
      has_api_key: !!apiKey,
      connection_verified: verified,
      [verified ? 'verified_at' : 'configured_at']: new Date().toISOString()
    };

    const { data: existingConfig } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('event_type', 'n8n_configuration')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConfig) {
      const { error } = await supabase
        .from('analytics_events')
        .update({ event_data: configData })
        .eq('id', existingConfig.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: 'n8n_configuration',
          event_data: configData
        });
      if (error) throw error;
    }
  };

  const copyWebhookUrl = (endpoint: string) => {
    const webhookUrl = `${n8nUrl.replace(/\/$/, '')}/webhook/${endpoint}`;
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard",
    });
  };

  const webhookEndpoints = [
    'return-processing',
    'retention-campaign', 
    'notification-dispatch',
    'order-sync',
    'auto-approve-returns',
    'ai-exchange-suggestions'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                n8n Server Connection
              </CardTitle>
              <CardDescription>
                Configure connection to your n8n automation server
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {connectionStatus === 'connected' && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </Badge>
              )}
              {connectionStatus === 'disconnected' && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Disconnected
                </Badge>
              )}
              {connectionStatus === 'unknown' && (
                <Badge variant="secondary">Unknown</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CORS Warning Notice */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-yellow-600 mt-1">⚠️</div>
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">CORS Limitations</p>
                <p className="text-yellow-700">
                  Due to browser security policies, webhook testing is limited. Test requests will be sent, 
                  but we cannot verify responses. Check your n8n workflow execution history to confirm receipt.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n8n-url">n8n Server URL *</Label>
              <Input
                id="n8n-url"
                type="url"
                placeholder="https://n8n.yourserver.com"
                value={n8nUrl}
                onChange={(e) => setN8nUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The base URL of your n8n server instance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key (Optional)</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="n8n_api_key_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                API key for authenticated requests
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Webhook Secret (Recommended)</Label>
            <Input
              id="webhook-secret"
              type="password"
              placeholder="Your webhook validation secret"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Secret for validating incoming webhook requests (HMAC)
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testConnection} 
              disabled={loading || !n8nUrl}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button 
              onClick={saveConfiguration} 
              disabled={loading || !n8nUrl}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button 
              onClick={() => setSetupInstructions(!setupInstructions)}
              variant="ghost"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Setup Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {setupInstructions && (
        <Card>
          <CardHeader>
            <CardTitle>n8n Setup Instructions</CardTitle>
            <CardDescription>
              Step-by-step guide to set up n8n for webhook automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">1. Deploy n8n Server</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Use n8n Cloud: <a href="https://n8n.cloud" target="_blank" className="text-blue-600 hover:underline">https://n8n.cloud</a></p>
                <p>• Self-host with Docker: <code className="bg-muted px-1 rounded">docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n</code></p>
                <p>• Deploy on Railway, Render, or other platforms</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">2. Enable Webhook Endpoints</h4>
              <p className="text-sm text-muted-foreground">
                In your n8n instance, create workflows with webhook triggers for these endpoints:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {webhookEndpoints.map(endpoint => (
                  <div key={endpoint} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <code className="text-xs">/webhook/{endpoint}</code>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyWebhookUrl(endpoint)}
                      disabled={!n8nUrl}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">3. Configure API Access (Optional)</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Generate API key in n8n Settings → API</p>
                <p>• Add the API key above for authenticated requests</p>
                <p>• Required for workflow management and monitoring</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">4. Test Connection</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Enter your n8n URL above</p>
                <p>• Click "Test Connection" to verify</p>
                <p>• Save configuration once connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {n8nUrl && connectionStatus === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Webhook URLs</CardTitle>
            <CardDescription>
              Use these URLs in your n8n workflows as webhook triggers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {webhookEndpoints.map(endpoint => (
                <div key={endpoint} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{endpoint.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <code className="text-xs text-muted-foreground">
                      {`${n8nUrl.replace(/\/$/, '')}/webhook/${endpoint}`}
                    </code>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyWebhookUrl(endpoint)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default N8nConnectionSetup;
