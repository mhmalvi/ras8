import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CreditCard, TrendingUp, Calendar, AlertTriangle, Loader2, ExternalLink, Crown, Zap, CheckCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

const Billing = () => {
  const { subscriptionData, loading, openCustomerPortal, createCheckout } = useSubscription();
  const { profile } = useMerchantProfile();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);

  // Get plan details
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

  // Mock usage data - in real app, this would come from billing_records
  const currentUsage = 87; // 87 returns this month
  const usagePercentage = typeof planDetails.limit === 'number' ? (currentUsage / planDetails.limit) * 100 : 65;

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

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading billing information...</span>
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
                  Billing & Subscription
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Manage your subscription and billing information
                </p>
              </div>
              <Button 
                onClick={handleUpdatePayment} 
                disabled={actionLoading} 
                variant="outline"
                className="transition-all duration-200 hover:shadow-lg"
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            </div>
            <Separator className="mt-4" />
          </div>

          {/* Metrics Cards */}
          <section className="animate-fade-in">
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
                      : 'Dec 15'
                    }
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Next payment due</p>
                  {subscriptionData?.trial_active && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Trial Active
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Plan Upgrade Options */}
          {currentPlan !== 'pro' && (
            <section className="animate-fade-in">
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
            </section>
          )}

          {/* Billing History */}
          <section className="animate-fade-in">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-primary" />
                  </div>
                  <span>Recent Invoices</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your billing history and payment records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock invoice data - in real app, this would come from Stripe/billing_records */}
                  <div className={cn(
                    "flex items-center justify-between p-4 border rounded-xl",
                    "hover:bg-muted/30 transition-colors duration-200"
                  )}>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Invoice #INV-001</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right space-y-1">
                        <p className="font-semibold text-foreground">{planDetails.price}</p>
                        <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "flex items-center justify-between p-4 border rounded-xl",
                    "hover:bg-muted/30 transition-colors duration-200"
                  )}>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Invoice #INV-002</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right space-y-1">
                        <p className="font-semibold text-foreground">{planDetails.price}</p>
                        <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {!subscriptionData?.subscribed && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="bg-muted/30 rounded-xl p-6">
                        <p className="font-medium">No billing history available</p>
                        <p className="text-sm mt-1">Invoices will appear here after your first payment</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Billing;