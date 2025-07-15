
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Settings, Monitor } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import WebhookActivityMonitor from "@/components/WebhookActivityMonitor";
import EnhancedWebhookManager from "@/components/EnhancedWebhookManager";

const WebhookDashboard = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage webhook processing for real-time Shopify integration
          </p>
        </div>

        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Monitor
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Webhook Management
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <WebhookActivityMonitor />
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <EnhancedWebhookManager />
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Webhook Configuration
                </CardTitle>
                <CardDescription>
                  Configure webhook endpoints and processing settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">✅ Shopify Webhook Processing Active</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Endpoint:</strong> Enhanced Shopify webhook processing</p>
                      <p><strong>Events:</strong> orders/create, orders/updated, app/uninstalled, GDPR events</p>
                      <p><strong>Security:</strong> HMAC signature verification with replay protection</p>
                      <p><strong>Rate Limiting:</strong> 1000 requests/hour per IP</p>
                      <p><strong>Processing:</strong> Real-time database sync with analytics tracking</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">📊 Monitoring Features</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• Real-time webhook activity tracking</p>
                      <p>• Processing time monitoring</p>
                      <p>• Error rate tracking and alerting</p>
                      <p>• Success rate analytics</p>
                      <p>• Historical webhook logs</p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-2">⚙️ Next Steps</h4>
                    <div className="text-sm text-amber-700 space-y-1">
                      <p>• Configure Shopify webhook URLs in your store admin</p>
                      <p>• Set up webhook secret for enhanced security</p>
                      <p>• Test webhook processing with sample events</p>
                      <p>• Monitor webhook activity and performance</p>
                    </div>
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

export default WebhookDashboard;
