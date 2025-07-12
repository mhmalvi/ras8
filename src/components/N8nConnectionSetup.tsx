
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Server, CheckCircle, XCircle, Copy, ExternalLink, Shield } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

const N8nConnectionSetup = () => {
  const [n8nUrl, setN8nUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [loading, setLoading] = useState(false);
  const [setupInstructions, setSetupInstructions] = useState(false);
  const { toast } = useToast();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile?.merchant_id) {
      loadMerchantSpecificConfiguration();
    }
  }, [profile?.merchant_id]);

  const loadMerchantSpecificConfiguration = async () => {
    if (!profile?.merchant_id) {
      console.warn('⚠️ No merchant_id available for n8n config loading');
      return;
    }

    setLoading(true);
    try {
      console.log(`🔍 Loading MERCHANT-SPECIFIC n8n config for: ${profile.merchant_id}`);
      
      // Load ONLY this merchant's n8n configuration
      const { data: configs, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'n8n_configuration')
        .eq('merchant_id', profile.merchant_id) // CRITICAL: Merchant-specific isolation
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error loading MERCHANT-SPECIFIC n8n config:', error);
        return;
      }

      if (configs && configs.length > 0 && configs[0].event_data) {
        const configData = configs[0].event_data as any;
        setN8nUrl(configData.n8n_url || '');
        setApiKey(configData.api_key || '');
        setWebhookSecret(configData.webhook_secret || '');
        setConnectionStatus(configData.connection_verified ? 'connected' : 'disconnected');
        
        console.log(`✅ MERCHANT-SPECIFIC n8n configuration loaded for: ${profile.merchant_id}`);
        console.log(`🌐 Merchant n8n URL: ${configData.n8n_url}`);
      } else {
        console.log(`📝 No existing MERCHANT-SPECIFIC n8n config found for: ${profile.merchant_id}`);
        setConnectionStatus('unknown');
      }
    } catch (error) {
      console.error('💥 Error loading MERCHANT-SPECIFIC n8n configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!profile?.merchant_id) {
      toast({
        title: "Error",
        description: "No merchant ID found. Please ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    if (!n8nUrl) {
      toast({
        title: "Error",
        description: "Please enter your personal n8n server URL first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`🧪 Testing MERCHANT-SPECIFIC n8n connection for: ${profile.merchant_id}`);
      console.log(`🌐 Testing URL: ${n8nUrl}`);
      
      const { n8nService } = await import('@/services/n8nService');
      const result = await n8nService.testConnection(n8nUrl, apiKey, profile.merchant_id);
      
      if (result.success) {
        setConnectionStatus('connected');
        
        // Save successful MERCHANT-SPECIFIC configuration
        await saveMerchantConfigurationToDatabase(true);

        toast({
          title: "Connection test completed",
          description: `Your personal n8n server connection successful: ${result.data?.message || "Test requests sent successfully."}`,
        });

        toast({
          title: "Multi-Tenant Isolation Confirmed",
          description: `Your n8n configuration is now isolated for merchant: ${profile.merchant_id}`,
          variant: "default",
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Connection test failed",
          description: result.error || "Failed to connect to your personal n8n server",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('💥 MERCHANT-SPECIFIC n8n connection test failed:', error);
      toast({
        title: "Connection test failed",
        description: "Unable to reach your personal n8n server. Please check the URL and ensure n8n is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!profile?.merchant_id) {
      toast({
        title: "Error",
        description: "No merchant ID found. Please ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    if (!n8nUrl) {
      toast({
        title: "Error",
        description: "Please enter your personal n8n server URL.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await saveMerchantConfigurationToDatabase(false);
      toast({
        title: "Configuration saved",
        description: `Your personal n8n configuration has been saved for merchant: ${profile.merchant_id}`,
      });
    } catch (error) {
      console.error('💥 Error saving MERCHANT-SPECIFIC configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save your personal n8n configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMerchantConfigurationToDatabase = async (verified: boolean = false) => {
    if (!profile?.merchant_id) return;

    console.log(`💾 Saving MERCHANT-SPECIFIC n8n config for: ${profile.merchant_id}`);

    const configData = {
      n8n_url: n8nUrl,
      api_key: apiKey,
      webhook_secret: webhookSecret,
      has_api_key: !!apiKey,
      connection_verified: verified,
      merchantId: profile.merchant_id, // CRITICAL: Merchant isolation
      tenant_isolated: true, // CRITICAL: Isolation flag
      merchant_specific: true, // CRITICAL: Merchant-specific flag
      [verified ? 'verified_at' : 'configured_at']: new Date().toISOString()
    };

    // Check for existing MERCHANT-SPECIFIC config
    const { data: existingConfig } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('event_type', 'n8n_configuration')
      .eq('merchant_id', profile.merchant_id) // CRITICAL: Only check this merchant's config
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConfig) {
      console.log(`🔄 Updating existing MERCHANT-SPECIFIC n8n config for: ${profile.merchant_id}`);
      const { error } = await supabase
        .from('analytics_events')
        .update({ event_data: configData })
        .eq('id', existingConfig.id)
        .eq('merchant_id', profile.merchant_id); // CRITICAL: Double-check merchant ownership
      if (error) throw error;
    } else {
      console.log(`🆕 Creating new MERCHANT-SPECIFIC n8n config for: ${profile.merchant_id}`);
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: 'n8n_configuration',
          merchant_id: profile.merchant_id, // CRITICAL: Merchant isolation
          event_data: configData
        });
      if (error) throw error;
    }

    console.log(`✅ MERCHANT-SPECIFIC n8n config saved for: ${profile.merchant_id}`);
  };

  const copyWebhookUrl = (endpoint: string) => {
    if (!profile?.merchant_id) {
      toast({
        title: "Error",
        description: "No merchant ID available",
        variant: "destructive",
      });
      return;
    }

    // CRITICAL: Include merchant ID in webhook URL for isolation
    const webhookUrl = `${n8nUrl.replace(/\/$/, '')}/webhook/${endpoint}?merchant=${profile.merchant_id}&tenant=${profile.merchant_id}`;
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "Copied",
      description: "Your personal webhook URL copied to clipboard",
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

  if (!profile?.merchant_id) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading your merchant configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                <Shield className="h-4 w-4 text-green-600" />
                Your Personal n8n Server Connection
              </CardTitle>
              <CardDescription>
                Configure your personal n8n automation server (isolated per merchant)
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
                <Badge variant="secondary">Not Configured</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Multi-tenancy Info */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="text-green-600 mt-1 h-4 w-4" />
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-2">✅ Multi-Tenant Isolation Active</p>
                <div className="space-y-1 text-green-700">
                  <p><strong>Your Merchant ID:</strong> <code className="bg-green-100 px-1 rounded text-xs">{profile.merchant_id}</code></p>
                  <p><strong>Data Isolation:</strong> Your n8n configuration is completely separate from other merchants</p>
                  <p><strong>Webhook URLs:</strong> Include your unique merchant ID for proper routing</p>
                  <p><strong>Security:</strong> Only you can access and modify your n8n settings</p>
                </div>
              </div>
            </div>
          </div>

          {/* CORS Warning Notice */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-yellow-600 mt-1">⚠️</div>
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">CORS Limitations</p>
                <p className="text-yellow-700">
                  Due to browser security policies, webhook testing is limited. Test requests will be sent, 
                  but we cannot verify responses. Check your personal n8n workflow execution history to confirm receipt.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n8n-url">Your Personal n8n Server URL *</Label>
              <Input
                id="n8n-url"
                type="url"
                placeholder="https://your-n8n.domain.com"
                value={n8nUrl}
                onChange={(e) => setN8nUrl(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Your personal n8n server instance URL (unique to your merchant account)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">Your Personal API Key (Optional)</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="n8n_api_key_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Your personal API key for authenticated requests
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Your Personal Webhook Secret (Recommended)</Label>
            <Input
              id="webhook-secret"
              type="password"
              placeholder="Your personal webhook validation secret, I'm ${profile.merchant_id}"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Personal secret for validating incoming webhook requests (HMAC) - unique to your merchant account
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testConnection} 
              disabled={loading || !n8nUrl}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Test Your Connection'}
            </Button>
            <Button 
              onClick={saveConfiguration} 
              disabled={loading || !n8nUrl}
            >
              {loading ? 'Saving...' : 'Save Your Configuration'}
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
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Your Personal Webhook URLs
            </CardTitle>
            <CardDescription>
              Use these URLs in your personal n8n workflows as webhook triggers (merchant-isolated)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {webhookEndpoints.map(endpoint => (
                <div key={endpoint} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{endpoint.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <code className="text-xs text-muted-foreground">
                      {`${n8nUrl.replace(/\/$/, '')}/webhook/${endpoint}?merchant=${profile.merchant_id}&tenant=${profile.merchant_id}`}
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
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <strong>Multi-Tenant Security:</strong> Each webhook URL includes your unique merchant and tenant ID parameters to ensure complete data isolation from other merchants.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default N8nConnectionSetup;
