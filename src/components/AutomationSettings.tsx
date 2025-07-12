
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, CheckCircle, XCircle, Server } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { n8nService } from '@/services/n8nService';

const AutomationSettings = () => {
  const [n8nUrl, setN8nUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'n8n_configuration')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (settings?.event_data) {
        const config = settings.event_data as { n8n_url?: string; has_api_key?: boolean };
        setN8nUrl(config.n8n_url || '');
        setConnectionStatus(config.has_api_key ? 'connected' : 'disconnected');
      }
    } catch (error) {
      console.error('Error loading automation settings:', error);
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
      const result = await n8nService.testConnection(n8nUrl, apiKey);
      
      if (result.success) {
        setConnectionStatus('connected');
        toast({
          title: "Connection successful",
          description: "Successfully connected to n8n server.",
        });
        
        // Auto-save successful configuration
        await saveSettings();
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Connection failed",
          description: result.error || "Failed to connect to n8n server",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "Connection failed",
        description: "Unable to reach n8n server. Please check the URL and ensure n8n is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
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
      const { error } = await supabase
        .from('analytics_events')
        .upsert({
          event_type: 'n8n_configuration',
          event_data: {
            n8n_url: n8nUrl,
            has_api_key: !!apiKey,
            configured_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "n8n configuration has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save n8n configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          n8n Configuration
        </CardTitle>
        <CardDescription>
          Configure your n8n server connection for automation workflows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-4 w-4" />
          <span className="text-sm font-medium">Connection Status:</span>
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

        <div className="space-y-2">
          <Label htmlFor="n8n-url">n8n Server URL</Label>
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
            API key for authenticated requests to n8n
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
            onClick={saveSettings} 
            disabled={loading || !n8nUrl}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Quick Setup Guide:</h4>
          <ol className="text-xs text-muted-foreground space-y-1">
            <li>1. Deploy n8n on your server or use n8n Cloud</li>
            <li>2. Enable webhook endpoints in your n8n instance</li>
            <li>3. Enter your n8n server URL above</li>
            <li>4. Optionally add an API key for authenticated requests</li>
            <li>5. Test the connection to verify setup</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationSettings;
