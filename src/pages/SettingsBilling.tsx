import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Crown, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  ArrowRight,
  Zap
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useRealBillingData } from "@/hooks/useRealBillingData";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";
import { BackButton } from "@/components/ui/back-button";

const SettingsBilling = () => {
  const { toast } = useToast();
  const { subscriptionData, loading: subscriptionLoading, openCustomerPortal, createCheckout } = useSubscription();
  const { usageStats, loading: billingLoading, error: billingError } = useRealBillingData();
  const { profile } = useMerchantProfile();
  const [actionLoading, setActionLoading] = useState(false);

  // Get plan details
  const getPlanDetails = (planType: string) => {
    switch (planType?.toLowerCase()) {
      case 'starter':
        return { 
          price: '$29', 
          limit: 100, 
          features: ['Basic AI suggestions', 'Email support', 'Standard analytics'],
          color: 'bg-blue-100 text-blue-800'
        };
      case 'growth':
        return { 
          price: '$79', 
          limit: 500, 
          features: ['Advanced AI suggestions', 'Priority support', 'Advanced analytics', 'Custom branding'],
          color: 'bg-purple-100 text-purple-800'
        };
      case 'pro':
        return { 
          price: '$149', 
          limit: 'Unlimited', 
          features: ['Premium AI suggestions', '24/7 support', 'Full analytics suite', 'Custom branding', 'API access'],
          color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
        };
      default:
        return { price: '$29', limit: 100, features: ['Basic features'], color: 'bg-gray-100 text-gray-800' };
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

  if (subscriptionLoading || billingLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading billing information...</span>
        </div>
      </AppLayout>
    );
  }

  if (billingError) {
    return (
      <AppLayout>
        <div className="text-center p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Billing Data</h2>
          <p className="text-muted-foreground">{billingError}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <BackButton to="/settings">Back to Settings</BackButton>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Billing & Subscription
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your plan, usage, and billing information
            </p>
          </div>
        </div>

        {/* Current Plan Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Current Plan Card */}
          <Card className="md:col-span-2 hover:shadow-md transition-all duration-300 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {currentPlan === 'pro' && <Crown className="h-6 w-6 text-yellow-500" />}
                    {currentPlan === 'growth' && <Zap className="h-6 w-6 text-purple-500" />}
                    {currentPlan === 'starter' && <CreditCard className="h-6 w-6 text-blue-500" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan</CardTitle>
                    <CardDescription>Your current subscription</CardDescription>
                  </div>
                </div>
                <Badge className={cn("px-3 py-1", planDetails.color)}>
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold">{planDetails.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Plan Features:</h4>
                  <div className="space-y-2">
                    {planDetails.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleUpdatePayment} 
                  disabled={actionLoading}
                  className="w-full"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Manage Billing
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Usage This Month</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{currentUsage}</div>
                <p className="text-sm text-muted-foreground">
                  {planDetails.limit === 'Unlimited' ? 'returns processed' : `of ${planDetails.limit} returns used`}
                </p>
              </div>

              {planDetails.limit !== 'Unlimited' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span className="font-medium">{Math.round(usagePercentage)}%</span>
                  </div>
                  <Progress 
                    value={usagePercentage} 
                    className={cn(
                      "h-3 transition-all duration-300",
                      usagePercentage >= 85 ? '[&>div]:bg-destructive' : 
                      usagePercentage >= 60 ? '[&>div]:bg-warning' : 
                      '[&>div]:bg-primary'
                    )}
                  />
                  {usagePercentage >= 85 && (
                    <div className="flex items-center space-x-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Approaching limit</span>
                    </div>
                  )}
                </div>
              )}

              {/* Next Billing Date */}
              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Next billing: {
                    subscriptionData?.subscription_end 
                      ? new Date(subscriptionData.subscription_end).toLocaleDateString()
                      : usageStats?.period_end 
                      ? new Date(usageStats.period_end).toLocaleDateString()
                      : 'N/A'
                  }</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Upgrades */}
        {currentPlan !== 'pro' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-primary" />
                <span>Upgrade Your Plan</span>
              </CardTitle>
              <CardDescription>
                Get more features and higher limits with an upgraded plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {currentPlan === 'starter' && (
                  <Card className="border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Zap className="h-5 w-5 text-purple-500" />
                          <span>Growth Plan</span>
                        </CardTitle>
                        <Badge className="bg-purple-100 text-purple-800">Popular</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-2xl font-bold">$79/month</div>
                      <p className="text-muted-foreground">Up to 500 returns/month</p>
                      <Button 
                        onClick={() => handleUpgradePlan('growth')} 
                        disabled={actionLoading}
                        className="w-full"
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Upgrade to Growth
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                <Card className="border-yellow-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <span>Pro Plan</span>
                      </CardTitle>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">Best Value</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold">$149/month</div>
                    <p className="text-muted-foreground">Unlimited returns processing</p>
                    <Button 
                      onClick={() => handleUpgradePlan('pro')} 
                      disabled={actionLoading}
                      className="w-full"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View your past invoices and payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No billing history available</h3>
              <p className="text-muted-foreground">
                Your billing history and invoices will appear here once you have completed payments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsBilling;