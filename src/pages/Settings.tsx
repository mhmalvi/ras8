import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Webhook, 
  Shield, 
  Activity, 
  Settings as SettingsIcon,
  ArrowRight,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useRealBillingData } from "@/hooks/useRealBillingData";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const navigate = useNavigate();
  const { usageStats } = useRealBillingData();
  const { subscriptionData } = useSubscription();

  const settingsOptions = [
    {
      id: 'billing',
      title: 'Billing & Subscription',
      description: 'Manage your plan, usage, and payment information',
      icon: <CreditCard className="h-6 w-6" />,
      path: '/settings/billing',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      badge: subscriptionData?.plan_type ? subscriptionData.plan_type.charAt(0).toUpperCase() + subscriptionData.plan_type.slice(1) : null,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'automation',
      title: 'Automation System',
      description: 'Configure automation rules, labels, and n8n workflows',
      icon: <Activity className="h-6 w-6" />,
      path: '/settings/automation',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      iconColor: 'text-orange-600',
      badge: 'n8n Ready',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'system',
      title: 'System Preferences',
      description: 'System health, notifications, and general settings',
      icon: <SettingsIcon className="h-6 w-6" />,
      path: '/settings/system',
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      iconColor: 'text-gray-600',
      badge: 'Operational',
      badgeColor: 'bg-gray-100 text-gray-800'
    }
  ];

  const handleCardClick = (path: string) => {
    console.log('🔄 Navigating to:', path);
    try {
      navigate(path);
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Configure your store settings, billing, and integrations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                  <p className="text-2xl font-bold capitalize">{subscriptionData?.plan_type || 'Starter'}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Usage</p>
                  <p className="text-2xl font-bold">{usageStats?.current_usage || 0}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Integrations</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Options Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsOptions.map((option) => (
            <Card 
              key={option.id}
              className={`transition-all duration-300 hover:shadow-lg hover:scale-105 ${option.color}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg bg-white/50 ${option.iconColor}`}>
                    {option.icon}
                  </div>
                  {option.badge && (
                    <Badge className={option.badgeColor}>
                      {option.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <CardTitle className="text-lg mb-2">{option.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {option.description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <Link 
                      to={option.path}
                      className="inline-flex items-center text-primary hover:text-primary-foreground hover:bg-primary p-2 h-auto rounded-md transition-colors"
                    >
                      <span className="text-sm font-medium">Configure</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common settings and management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                variant="outline" 
                className="h-auto p-4 justify-start"
                onClick={() => navigate('/settings/billing')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Upgrade Plan</div>
                    <div className="text-sm text-muted-foreground">Get more features</div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 justify-start"
                onClick={() => navigate('/settings/integrations')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Connect Shopify</div>
                    <div className="text-sm text-muted-foreground">Sync your store</div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 justify-start"
                onClick={() => navigate('/settings/system')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">System Health</div>
                    <div className="text-sm text-muted-foreground">Check status</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;