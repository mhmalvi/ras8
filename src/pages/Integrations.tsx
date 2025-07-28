import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Integrations
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Connect your favorite tools and services
                </p>
              </div>
              <Button className="transition-all duration-200 hover:shadow-lg">
                <Globe className="mr-2 h-4 w-4" />
                Browse Integrations
              </Button>
            </div>
            <Separator className="mt-4" />
          </div>

          {/* Integrations Grid */}
          <section className="animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => (
                <Card key={integration.name} className="shadow-sm hover:shadow-md transition-shadow duration-300">
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
                        className="transition-all duration-200 hover:shadow-sm"
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
          </section>

          {/* Custom Integrations */}
          <section className="animate-fade-in">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Custom Integrations</CardTitle>
                <CardDescription>
                  Need a custom integration? Our team can help you connect any system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="transition-all duration-200 hover:shadow-sm">
                  Request Custom Integration
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Integrations;