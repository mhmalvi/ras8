import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, CreditCard, Bell, Webhook, Shield } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

// Import existing components
import SystemSetup from "@/components/SystemSetup";
import EmailNotificationSettings from "@/components/EmailNotificationSettings";

// Import billing content from the existing Billing page
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, AlertTriangle, Loader2, ExternalLink, Crown, Zap, CheckCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useRealBillingData } from "@/hooks/useRealBillingData";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { useToast } from "@/hooks/use-toast";

// Import webhook components
import { Plus, Activity } from "lucide-react";
import { useWebhookMonitoring } from "@/hooks/useWebhookMonitoring";

const Settings = () => {
  const [activeTab, setActiveTab] = useState('system');
  const { toast } = useToast();

  // Billing-related hooks
  const { subscriptionData, loading: subscriptionLoading, openCustomerPortal, createCheckout } = useSubscription();
  const { usageStats, loading: billingLoading, error: billingError } = useRealBillingData();
  const { profile } = useMerchantProfile();
  const [actionLoading, setActionLoading] = useState(false);

  // Webhook-related hooks
  const { activities, stats: webhookStats, loading: webhookLoading, error: webhookError } = useWebhookMonitoring();

  // Get plan details (from original Billing page)
  const getPlanDetails = (planType: string) => {
    switch (planType?.toLowerCase()) {
      case 'starter':
        return { price: '$29', limit: 100, features: ['Basic AI suggestions', 'Email support', 'Standard analytics'] };
      case 'growth':
        return { price: '$79', limit: 500, features: ['Advanced AI suggestions', 'Priority support', 'Advanced analytics', 'Custom branding'] };
      case 'pro':
        return { price: '$149', limit: 'Unlimited', features: ['Premium AI suggestions', '24/7 support', 'Full analytics suite', 'Custom branding', 'API access'] };
      default:
        return { price: '$29', limit: 100, features: ['Basic features'] };
    }
  };

  const currentPlan = subscriptionData?.plan_type || 'starter';
  const planDetails = getPlanDetails(currentPlan);
  const currentUsage = usageStats?.current_usage || 0;
  const usagePercentage = usageStats?.usage_percentage || 0;

  const handleUpdatePayment = async () => {
    setActionLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open payment management portal",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradePlan = async (targetPlan: string) => {
    setActionLoading(true);
    try {
      await createCheckout(targetPlan);
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to start checkout process",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Billing Tab Content
  const BillingTabContent = () => {
    if (subscriptionLoading || billingLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading billing information...</span>
        </div>
      );
    }

    if (billingError) {
      return (
        <div className="text-center p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Billing Data</h2>
          <p className="text-muted-foreground">{billingError}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Billing metrics cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Current Plan */}
          <Card className={cn(
            "shadow-sm hover:shadow-md transition-all duration-300",
            "border-border hover:border-primary/50"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-foreground">Current Plan</CardTitle>
              <div className="flex items-center space-x-2">
                {currentPlan === 'pro' && <Crown className="h-4 w-4 text-yellow-500" />}
                {currentPlan === 'growth' && <Zap className="h-4 w-4 text-blue-500" />}
                <Badge 
                  variant={currentPlan === 'pro' ? 'default' : 'secondary'} 
                  className="capitalize"
                >
                  {currentPlan}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">{planDetails.price}/month</div>
              <p className="text-sm text-muted-foreground mb-4">
                {planDetails.limit === 'Unlimited' ? 'Unlimited returns processing' : `Up to ${planDetails.limit} returns/month`}
              </p>
              <div className="space-y-3">
                {planDetails.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Usage This Month */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-foreground">Usage This Month</CardTitle>
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">{currentUsage}</div>
              <p className="text-sm text-muted-foreground mb-4">
                {planDetails.limit === 'Unlimited' ? 'returns processed' : `of ${planDetails.limit} returns used`}
              </p>
              {planDetails.limit !== 'Unlimited' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-medium text-foreground">{Math.round(usagePercentage)}%</span>
                  </div>
                  <Progress 
                    value={usagePercentage} 
                    className={cn(
                      "h-3 transition-all duration-300",
                      usagePercentage > 90 ? '[&>div]:bg-red-500' : 
                      usagePercentage > 75 ? '[&>div]:bg-yellow-500' : 
                      '[&>div]:bg-green-500'
                    )}
                  />
                  {usagePercentage > 90 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <p className="text-sm text-red-600 font-medium">Approaching plan limit</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Billing */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-foreground">Next Billing</CardTitle>
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">
                {subscriptionData?.subscription_end 
                  ? new Date(subscriptionData.subscription_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : usageStats?.period_end 
                  ? new Date(usageStats.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'N/A'
                }
              </div>
              <p className="text-sm text-muted-foreground mb-3">Next payment due</p>
              <Button 
                onClick={handleUpdatePayment} 
                disabled={actionLoading} 
                variant="outline"
                className="w-full transition-all duration-200 hover:shadow-lg"
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Plan Upgrade Options */}
        {currentPlan !== 'pro' && (
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <span>Upgrade Your Plan</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Get more features and higher limits with an upgraded plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                {currentPlan === 'starter' && (
                  <div className={cn(
                    "border rounded-xl p-6 transition-all duration-300",
                    "hover:border-primary/50 hover:shadow-lg hover:scale-105 cursor-pointer group"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        Growth Plan
                      </h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Zap className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-2">$79/month</p>
                    <p className="text-muted-foreground mb-6">Up to 500 returns/month</p>
                    <Button 
                      onClick={() => handleUpgradePlan('growth')} 
                      disabled={actionLoading}
                      className="w-full transition-all duration-200 hover:shadow-lg"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Upgrade to Growth
                    </Button>
                  </div>
                )}
                <div className={cn(
                  "border rounded-xl p-6 transition-all duration-300",
                  "hover:border-primary/50 hover:shadow-lg hover:scale-105 cursor-pointer group"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      Pro Plan
                    </h3>
                    <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Best Value
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-2">$149/month</p>
                  <p className="text-muted-foreground mb-6">Unlimited returns processing</p>
                  <Button 
                    onClick={() => handleUpgradePlan('pro')} 
                    disabled={actionLoading}
                    className="w-full transition-all duration-200 hover:shadow-lg"
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Crown className="mr-2 h-4 w-4" />
                    )}
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Webhooks Tab Content
  const WebhooksTabContent = () => {
    if (webhookLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading webhook data...</span>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Webhook Stats */}
        {webhookStats && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{webhookStats.total}</p>
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
                    <p className="text-2xl font-bold text-green-600">{webhookStats.successful}</p>
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
                    <p className="text-2xl font-bold text-red-600">{webhookStats.failed}</p>
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
                    <p className="text-2xl font-bold">{Math.round(webhookStats.averageProcessingTime)}ms</p>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Webhook className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Webhook Management */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Webhook className="h-5 w-5 text-primary" />
                  </div>
                  <span>Webhook Configuration</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage webhook endpoints and delivery settings
                </CardDescription>
              </div>
              <Button className="transition-all duration-200 hover:shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {webhookError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-2">Error loading webhook data</p>
                <p className="text-sm text-muted-foreground">{webhookError}</p>
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
                <h4 className="font-medium">Recent Activity</h4>
                {activities.slice(0, 5).map((activity) => (
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
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Configure your store settings, billing, and integrations
            </p>
            <Separator className="mt-4" />
          </div>
          
          {/* Settings Tabs */}
          <section className="animate-fade-in">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 max-w-lg h-12">
                <TabsTrigger 
                  value="system" 
                  className="flex items-center space-x-2 transition-all duration-200"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:block">System</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="billing" 
                  className="flex items-center space-x-2 transition-all duration-200"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:block">Billing</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="webhooks"
                  className="flex items-center space-x-2 transition-all duration-200"
                >
                  <Webhook className="h-4 w-4" />
                  <span className="hidden sm:block">Webhooks</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="flex items-center space-x-2 transition-all duration-200"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:block">Notifications</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="system" className="space-y-0">
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <span>System Configuration</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Configure your Shopify integration and system settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SystemSetup />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="billing" className="space-y-0">
                <BillingTabContent />
              </TabsContent>

              <TabsContent value="webhooks" className="space-y-0">
                <WebhooksTabContent />
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-0">
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <span>Notification Settings</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Configure email notifications and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EmailNotificationSettings />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;