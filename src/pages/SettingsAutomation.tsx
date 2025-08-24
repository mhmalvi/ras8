import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, Settings, Server, Key, Webhook, AlertCircle } from "lucide-react";
import AutomationSettings from "@/components/AutomationSettings";
import N8nConnectionSetup from "@/components/N8nConnectionSetup";
import { BackButton } from "@/components/ui/back-button";

const SettingsAutomation = () => {
  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <BackButton to="/settings">Back to Settings</BackButton>
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Automation Configuration
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Set up and configure your automation infrastructure, servers, and API connections
            </p>
          </div>
        </div>

        {/* Navigation hint */}
        <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg border">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <strong>Configuration vs Management:</strong> This page is for setting up your automation infrastructure. 
            To manage active workflows and rules, visit <a href="/automations" className="text-primary hover:underline">Automations</a>.
          </p>
        </div>

        {/* Configuration Tabs */}
        <Tabs defaultValue="n8n" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="n8n" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              n8n Server
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Endpoints
            </TabsTrigger>
          </TabsList>

          <TabsContent value="n8n" className="space-y-6">
            <div className="grid gap-6">
              {/* n8n Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    n8n Server Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your n8n server connection for automated workflows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AutomationSettings />
                </CardContent>
              </Card>

              {/* Advanced n8n Setup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Advanced n8n Setup
                  </CardTitle>
                  <CardDescription>
                    Advanced configuration options and connection details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <N8nConnectionSetup />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Key Management
                </CardTitle>
                <CardDescription>
                  Manage API keys for external service integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Shopify API</h4>
                      <p className="text-sm text-muted-foreground">Connect your Shopify store</p>
                    </div>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">n8n API Key</h4>
                      <p className="text-sm text-muted-foreground">Authenticate n8n requests</p>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Service</h4>
                      <p className="text-sm text-muted-foreground">SendGrid or similar service</p>
                    </div>
                    <Badge variant="outline">Not Configured</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Endpoints
                </CardTitle>
                <CardDescription>
                  Configure webhook endpoints for external integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Shopify Webhooks</h4>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Receives order events, returns, and customer updates
                    </p>
                    <code className="text-xs bg-muted p-2 rounded block">
                      https://your-app.com/webhooks/shopify
                    </code>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">n8n Trigger Endpoints</h4>
                      <Badge variant="secondary">Configuration Required</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Trigger n8n workflows from external events
                    </p>
                    <code className="text-xs bg-muted p-2 rounded block">
                      Configure after n8n server setup
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsAutomation;