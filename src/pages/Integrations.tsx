import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Globe, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Search, 
  Plus, 
  ShoppingCart, 
  CreditCard, 
  Brain, 
  Mail, 
  MessageSquare,
  Zap,
  Clock,
  Star,
  ArrowRight,
  Shield
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";

const Integrations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const integrationCategories = [
    { id: "all", name: "All Integrations", count: 12 },
    { id: "ecommerce", name: "E-commerce", count: 3 },
    { id: "payment", name: "Payments", count: 2 },
    { id: "ai", name: "AI & ML", count: 2 },
    { id: "communication", name: "Communication", count: 3 },
    { id: "automation", name: "Automation", count: 2 }
  ];

  const integrations = [
    {
      id: "shopify",
      name: "Shopify",
      description: "Sync orders, products, and customer data from your Shopify store",
      status: "connected",
      category: "ecommerce",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50",
      features: ["Order sync", "Product catalog", "Customer data"],
      setupTime: "2 min",
      popularity: 5,
      lastSync: "2 minutes ago"
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Process payments and manage billing subscriptions",
      status: "connected",
      category: "payment",
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      features: ["Payment processing", "Subscription billing", "Webhook events"],
      setupTime: "3 min",
      popularity: 5,
      lastSync: "5 minutes ago"
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "AI-powered return recommendations and customer insights",
      status: "connected",
      category: "ai",
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      features: ["Smart recommendations", "Text analysis", "Automated responses"],
      setupTime: "1 min",
      popularity: 4,
      lastSync: "1 minute ago"
    },
    {
      id: "klaviyo",
      name: "Klaviyo",
      description: "Email marketing automation and customer segmentation",
      status: "available",
      category: "communication",
      icon: Mail,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      features: ["Email campaigns", "Customer segments", "Analytics"],
      setupTime: "5 min",
      popularity: 4,
      lastSync: null
    },
    {
      id: "slack",
      name: "Slack",
      description: "Get real-time notifications about returns and issues",
      status: "available",
      category: "communication",
      icon: MessageSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      features: ["Real-time alerts", "Team notifications", "Custom channels"],
      setupTime: "2 min",
      popularity: 3,
      lastSync: null
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect with 5000+ apps using automated workflows",
      status: "available",
      category: "automation",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      features: ["Workflow automation", "5000+ app connections", "Custom triggers"],
      setupTime: "10 min",
      popularity: 4,
      lastSync: null
    }
  ];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedIntegrations = integrations.filter(i => i.status === "connected");
  const availableIntegrations = integrations.filter(i => i.status === "available");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "available":
        return <Plus className="h-5 w-5 text-muted-foreground" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>;
      case "available":
        return <Badge variant="secondary">Available</Badge>;
      default:
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Integrations
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Connect your favorite tools to automate and enhance your returns process
              </p>
            </div>
            <Button className="hover-scale">
              <Globe className="mr-2 h-4 w-4" />
              Browse Marketplace
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Connected</p>
                    <p className="text-2xl font-bold text-green-600">{connectedIntegrations.length}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold text-blue-600">{availableIntegrations.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold text-purple-600">{integrationCategories.length - 1}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {integrationCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.name}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="connected">Connected</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredIntegrations.map((integration, index) => (
                <Card 
                  key={integration.id} 
                  className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${integration.bgColor}`}>
                          <integration.icon className={`h-6 w-6 ${integration.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            {integration.popularity >= 4 && (
                              <div className="flex">
                                {[...Array(integration.popularity)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            )}
                          </div>
                          <CardDescription className="text-sm leading-relaxed">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusIcon(integration.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 3).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(integration.status)}
                        {integration.status === "connected" && integration.lastSync && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {integration.lastSync}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        size="sm"
                        variant={integration.status === "connected" ? "outline" : "default"}
                        className="group-hover:shadow-md transition-all duration-200"
                      >
                        {integration.status === "connected" ? (
                          <>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </>
                        ) : (
                          <>
                            Connect
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Setup Time */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{integration.setupTime} setup</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="connected" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {connectedIntegrations.map((integration, index) => (
                <Card 
                  key={integration.id} 
                  className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-green-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${integration.bgColor}`}>
                          <integration.icon className={`h-6 w-6 ${integration.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {integration.lastSync}
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      variant="outline"
                      className="w-full group-hover:shadow-md transition-all duration-200"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Integration
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="available" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableIntegrations.map((integration, index) => (
                <Card 
                  key={integration.id} 
                  className="group hover:shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${integration.bgColor}`}>
                          <integration.icon className={`h-6 w-6 ${integration.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Available</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {integration.setupTime} setup
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      className="w-full group-hover:shadow-md transition-all duration-200"
                    >
                      Connect Now
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Custom Integration CTA */}
        <Card className="bg-gradient-to-r from-primary/5 to-blue-600/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Need a Custom Integration?</h3>
                <p className="text-muted-foreground">
                  Don't see your favorite tool? Our team can build custom integrations for your specific needs.
                </p>
              </div>
              <Button className="hover-scale">
                Request Custom Integration
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Integrations;