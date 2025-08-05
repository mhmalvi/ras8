import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  CheckCircle, 
  ArrowRight,
  ShoppingCart, 
  CreditCard, 
  Brain, 
  Mail, 
  MessageSquare,
  Zap
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Integrations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const integrations = [
    {
      id: "shopify",
      name: "Shopify",
      description: "Sync orders, products, and customer data",
      status: "connected",
      icon: ShoppingCart,
      color: "text-green-600"
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Process payments and manage billing",
      status: "connected", 
      icon: CreditCard,
      color: "text-blue-600"
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "AI-powered recommendations and insights",
      status: "connected",
      icon: Brain,
      color: "text-purple-600"
    },
    {
      id: "klaviyo",
      name: "Klaviyo",
      description: "Email marketing and customer segmentation",
      status: "available",
      icon: Mail,
      color: "text-orange-600"
    },
    {
      id: "slack",
      name: "Slack",
      description: "Team notifications and alerts",
      status: "available",
      icon: MessageSquare,
      color: "text-indigo-600"
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect with 5000+ apps and workflows",
      status: "available",
      icon: Zap,
      color: "text-yellow-600"
    }
  ];

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleIntegrationAction = (integration: typeof integrations[0]) => {
    if (integration.status === "connected") {
      // Handle manage/configure action
      toast({
        title: `Managing ${integration.name}`,
        description: `Opening ${integration.name} configuration...`,
      });
    } else {
      // Handle connect action
      toast({
        title: `Connecting ${integration.name}`,
        description: `Starting connection process for ${integration.name}...`,
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect your favorite tools and services
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Integrations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <integration.icon className={`h-5 w-5 ${integration.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  {integration.status === "connected" && (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={integration.status === "connected" ? "default" : "secondary"}>
                    {integration.status === "connected" ? "Connected" : "Available"}
                  </Badge>
                  
                  <Button 
                    size="sm" 
                    variant={integration.status === "connected" ? "outline" : "default"}
                    onClick={() => handleIntegrationAction(integration)}
                  >
                    {integration.status === "connected" ? "Manage" : "Connect"}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-medium mb-2">Need something else?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Contact us to request a custom integration
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast({
                  title: "Custom Integration Request",
                  description: "We'll contact you shortly to discuss your requirements.",
                })}
              >
                Request Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Integrations;