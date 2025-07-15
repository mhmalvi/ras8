import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Webhook, Plus, Settings, Activity } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const Webhooks = () => {
  const webhooks = [
    {
      id: "wh_001",
      name: "Return Status Updates",
      url: "https://api.yourstore.com/webhooks/returns",
      events: ["return.created", "return.updated", "return.completed"],
      status: "active",
      lastDelivery: "2 minutes ago"
    },
    {
      id: "wh_002", 
      name: "Exchange Notifications",
      url: "https://api.yourstore.com/webhooks/exchanges",
      events: ["exchange.requested", "exchange.approved"],
      status: "active",
      lastDelivery: "1 hour ago"
    },
    {
      id: "wh_003",
      name: "Analytics Updates",
      url: "https://analytics.yourstore.com/webhook",
      events: ["analytics.daily_report"],
      status: "failed",
      lastDelivery: "Failed 3 hours ago"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
            <p className="text-muted-foreground">Manage webhook endpoints and event notifications</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Webhook
          </Button>
        </div>

        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Webhook className="h-5 w-5" />
                      <span>{webhook.name}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {webhook.url}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={webhook.status === "active" ? "default" : "destructive"}
                    >
                      {webhook.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Events:</p>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last delivery:</span>
                    <span className={webhook.status === "failed" ? "text-red-600" : "text-green-600"}>
                      {webhook.lastDelivery}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Webhook Activity</span>
            </CardTitle>
            <CardDescription>Recent webhook delivery logs and responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">return.created</p>
                  <p className="text-sm text-muted-foreground">To: Return Status Updates</p>
                </div>
                <div className="text-right">
                  <Badge variant="default">200 OK</Badge>
                  <p className="text-sm text-muted-foreground">2 min ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">return.updated</p>
                  <p className="text-sm text-muted-foreground">To: Return Status Updates</p>
                </div>
                <div className="text-right">
                  <Badge variant="default">200 OK</Badge>
                  <p className="text-sm text-muted-foreground">15 min ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">analytics.daily_report</p>
                  <p className="text-sm text-muted-foreground">To: Analytics Updates</p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">500 Error</Badge>
                  <p className="text-sm text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Webhooks;