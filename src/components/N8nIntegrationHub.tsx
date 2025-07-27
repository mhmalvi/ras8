import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, ExternalLink, Play, Settings, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WebhookEndpointManager from './WebhookEndpointManager';

const N8nIntegrationHub = () => {
  const { toast } = useToast();
  const [n8nConfig, setN8nConfig] = useState({
    instance_url: '',
    webhook_url: '',
    api_key: ''
  });
  
  const [testPayload, setTestPayload] = useState({
    event_type: 'return_created',
    test_data: JSON.stringify({
      return_id: 'test_return_123',
      customer_email: 'test@example.com',
      shopify_order_id: '12345',
      reason: 'Size too small',
      total_amount: 99.99,
      status: 'requested'
    }, null, 2)
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');

  const predefinedWorkflows = [
    {
      name: 'Return Request Notifications',
      description: 'Send Slack/email notifications when new returns are created',
      events: ['return_created'],
      complexity: 'Simple',
      estimatedTime: '15 minutes'
    },
    {
      name: 'Customer Retention Automation',
      description: 'Trigger personalized offers when customers request returns',
      events: ['return_created', 'return_approved'],
      complexity: 'Intermediate',
      estimatedTime: '45 minutes'
    },
    {
      name: 'Inventory Management Integration',
      description: 'Update inventory systems when returns are completed',
      events: ['return_completed'],
      complexity: 'Advanced',
      estimatedTime: '2 hours'
    },
    {
      name: 'AI Insights Data Pipeline',
      description: 'Feed return data to analytics platforms for insights',
      events: ['return_created', 'return_updated', 'ai_suggestion_created'],
      complexity: 'Advanced',
      estimatedTime: '1.5 hours'
    }
  ];

  const testN8nConnection = async () => {
    if (!n8nConfig.webhook_url) {
      toast({
        title: "Error",
        description: "Please enter your n8n webhook URL",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus('testing');

    try {
      const response = await fetch(n8nConfig.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          event_type: 'connection_test',
          data: {
            message: 'Test connection from Returns Automation SaaS',
            platform: 'lovable'
          }
        })
      });

      // Since we're using no-cors, we can't check the response status
      // We'll assume success if no error is thrown
      setConnectionStatus('connected');
      
      toast({
        title: "Connection Test Sent",
        description: "Test payload sent to n8n. Check your n8n workflow execution log.",
      });

    } catch (error) {
      console.error('n8n connection test failed:', error);
      setConnectionStatus('failed');
      
      toast({
        title: "Connection Failed",
        description: "Failed to connect to n8n webhook. Please verify the URL.",
        variant: "destructive",
      });
    }
  };

  const sendTestPayload = async () => {
    if (!n8nConfig.webhook_url) {
      toast({
        title: "Error",
        description: "Please enter your n8n webhook URL first",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = JSON.parse(testPayload.test_data);
      
      const response = await fetch(n8nConfig.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          event_type: testPayload.event_type,
          timestamp: new Date().toISOString(),
          data: payload
        })
      });

      toast({
        title: "Test Payload Sent",
        description: `${testPayload.event_type} event sent to n8n successfully`,
      });

    } catch (error) {
      console.error('Failed to send test payload:', error);
      toast({
        title: "Error",
        description: "Failed to send test payload. Check the JSON format.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            n8n Integration Hub
          </CardTitle>
          <CardDescription>
            Connect your Returns Automation platform with n8n for advanced workflow automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Connection Status</span>
            {getStatusBadge()}
          </div>
          
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To get started, create a webhook trigger in your n8n workflow and paste the webhook URL below.
              <a 
                href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary ml-1 hover:underline"
              >
                Learn more about n8n webhooks <ExternalLink className="h-3 w-3 inline" />
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>n8n Configuration</CardTitle>
              <CardDescription>
                Configure your n8n instance connection details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instance_url">n8n Instance URL (Optional)</Label>
                <Input
                  id="instance_url"
                  value={n8nConfig.instance_url}
                  onChange={(e) => setN8nConfig({ ...n8nConfig, instance_url: e.target.value })}
                  placeholder="https://your-n8n-instance.com"
                />
              </div>

              <div>
                <Label htmlFor="webhook_url">Webhook URL *</Label>
                <Input
                  id="webhook_url"
                  value={n8nConfig.webhook_url}
                  onChange={(e) => setN8nConfig({ ...n8nConfig, webhook_url: e.target.value })}
                  placeholder="https://your-n8n-instance.com/webhook/returns-automation"
                />
              </div>

              <div>
                <Label htmlFor="api_key">API Key (Optional)</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={n8nConfig.api_key}
                  onChange={(e) => setN8nConfig({ ...n8nConfig, api_key: e.target.value })}
                  placeholder="Your n8n API key for advanced features"
                />
              </div>

              <Button onClick={testN8nConnection} disabled={connectionStatus === 'testing'}>
                <Settings className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Workflows</CardTitle>
              <CardDescription>
                Pre-built workflow templates to get you started quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {predefinedWorkflows.map((workflow, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold">{workflow.name}</h4>
                          <Badge variant={workflow.complexity === 'Simple' ? 'default' : workflow.complexity === 'Intermediate' ? 'secondary' : 'outline'}>
                            {workflow.complexity}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {workflow.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>⏱️ {workflow.estimatedTime}</span>
                          <span>📡 {workflow.events.length} events</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          {workflow.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="h-3 w-3 mr-2" />
                          View Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Testing</CardTitle>
              <CardDescription>
                Test your n8n workflow with sample return data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="event_type">Event Type</Label>
                <Input
                  id="event_type"
                  value={testPayload.event_type}
                  onChange={(e) => setTestPayload({ ...testPayload, event_type: e.target.value })}
                  placeholder="return_created"
                />
              </div>

              <div>
                <Label htmlFor="test_data">Test Payload (JSON)</Label>
                <Textarea
                  id="test_data"
                  value={testPayload.test_data}
                  onChange={(e) => setTestPayload({ ...testPayload, test_data: e.target.value })}
                  placeholder="Enter JSON payload"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={sendTestPayload} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Send Test Payload
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhookEndpointManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default N8nIntegrationHub;