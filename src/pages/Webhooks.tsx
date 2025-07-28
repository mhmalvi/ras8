import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Webhook, Plus, Settings, Activity, Loader2, Zap } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useWebhookMonitoring } from "@/hooks/useWebhookMonitoring";
import { cn } from "@/lib/utils";

const Webhooks = () => {
  const { activities, stats, loading, error } = useWebhookMonitoring();

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading webhook data...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Webhooks
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Monitor webhook endpoints and delivery logs
                </p>
              </div>
              <Button className="transition-all duration-200 hover:shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </div>
            <Separator className="mt-4" />
          </div>

          {/* Stats Cards */}
          <section className="animate-fade-in">
            {stats && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Successful</p>
                        <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
                      </div>
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                      </div>
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Activity className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Time</p>
                        <p className="text-2xl font-bold">{Math.round(stats.averageProcessingTime)}ms</p>
                      </div>
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Webhook className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </section>

          {/* Webhook Activity */}
          <section className="animate-fade-in">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Latest webhook delivery logs and responses
                </CardDescription>
              </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-2">Error loading webhook data</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No webhook activity found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Webhook delivery logs will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{activity.webhook_type}</p>
                      <p className="text-sm text-muted-foreground">Source: {activity.source}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={activity.status === 'completed' ? 'default' : 'destructive'}>
                        {activity.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Webhooks;