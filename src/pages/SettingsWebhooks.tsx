import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Webhook, 
  Plus, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Settings
} from "lucide-react";
import { useWebhookMonitoring } from "@/hooks/useWebhookMonitoring";
import AppLayout from "@/components/AppLayout";

const SettingsWebhooks = () => {
  const { activities, stats: webhookStats, loading: webhookLoading, error: webhookError } = useWebhookMonitoring();

  if (webhookLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading webhook data...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Webhooks
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage webhook endpoints and delivery settings
          </p>
        </div>

        {/* Webhook Stats */}
        {webhookStats && (
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{webhookStats.total}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{webhookStats.successful}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-destructive">{webhookStats.failed}</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Time</p>
                    <p className="text-2xl font-bold">{Math.round(webhookStats.averageProcessingTime)}ms</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Webhook className="h-5 w-5" />
                  <span>Webhook Endpoints</span>
                </CardTitle>
                <CardDescription>
                  Configure webhook endpoints for real-time event notifications
                </CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {webhookError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-destructive mb-2">Error loading webhook data</p>
                <p className="text-sm text-muted-foreground">{webhookError}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Example webhook configurations */}
                <div className="space-y-4">
                  <Card className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="default">Active</Badge>
                            <h4 className="font-medium">Order Created</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            https://your-app.com/webhooks/order-created
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>• Last delivered: 2 hours ago</span>
                            <span>• Success rate: 98.5%</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch defaultChecked />
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="secondary">Inactive</Badge>
                            <h4 className="font-medium">Return Requested</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            https://your-app.com/webhooks/return-requested
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>• Last delivered: Never</span>
                            <span>• Success rate: N/A</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium mb-1">Webhook Documentation</h4>
                      <p className="text-sm text-muted-foreground">
                        Learn how to implement and test webhook endpoints
                      </p>
                    </div>
                    <Button variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Docs
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest webhook delivery attempts and responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities && activities.length > 0 ? (
                activities.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {activity.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium">Webhook Event</p>
                        <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant={activity.status === 'completed' ? 'default' : 'destructive'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No webhook activity</h3>
                  <p className="text-muted-foreground">
                    Webhook delivery attempts will appear here once you start receiving events.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsWebhooks;