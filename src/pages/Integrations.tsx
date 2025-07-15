import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Settings, CheckCircle, XCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const Integrations = () => {
  const integrations = [
    {
      name: "Shopify",
      description: "E-commerce platform integration",
      status: "connected",
      icon: "🛍️"
    },
    {
      name: "Stripe",
      description: "Payment processing",
      status: "connected",
      icon: "💳"
    },
    {
      name: "OpenAI",
      description: "AI-powered recommendations",
      status: "connected",
      icon: "🤖"
    },
    {
      name: "Klaviyo",
      description: "Email marketing automation",
      status: "disconnected",
      icon: "📧"
    },
    {
      name: "Slack",
      description: "Team notifications",
      status: "disconnected",
      icon: "💬"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">Connect your favorite tools and services</p>
          </div>
          <Button>
            <Globe className="mr-2 h-4 w-4" />
            Browse Integrations
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </div>
                  </div>
                  {integration.status === "connected" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={integration.status === "connected" ? "default" : "secondary"}
                  >
                    {integration.status === "connected" ? "Connected" : "Not Connected"}
                  </Badge>
                  <Button 
                    variant={integration.status === "connected" ? "outline" : "default"}
                    size="sm"
                  >
                    {integration.status === "connected" ? (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Custom Integrations</CardTitle>
            <CardDescription>
              Need a custom integration? Our team can help you connect any system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">
              Request Custom Integration
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Integrations;