import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, TrendingUp, Calendar, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Billing & Subscription</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your subscription and billing information
            </p>
          </div>
          <Button onClick={handleUpdatePayment} disabled={actionLoading} variant="outline">
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Manage Billing
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Plan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <Badge variant="default" className="capitalize">
                {currentPlan}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{planDetails.price}/month</div>
              <p className="text-xs text-muted-foreground mb-4">
                {planDetails.limit === 'Unlimited' ? 'Unlimited returns processing' : `Up to ${planDetails.limit} returns/month`}
              </p>
              <div className="space-y-2">
                {planDetails.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <div className="w-1 h-1 bg-green-600 rounded-full mr-2" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Usage This Month */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentUsage}</div>
              <p className="text-xs text-muted-foreground mb-3">
                {planDetails.limit === 'Unlimited' ? 'returns processed' : `of ${planDetails.limit} returns used`}
              </p>
              {planDetails.limit !== 'Unlimited' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Usage</span>
                    <span>{Math.round(usagePercentage)}%</span>
                  </div>
                  <Progress 
                    value={usagePercentage} 
                    className={`h-2 ${usagePercentage > 90 ? '[&>div]:bg-red-500' : usagePercentage > 75 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                  />
                  {usagePercentage > 90 && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Approaching plan limit</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Billing */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptionData?.subscription_end 
                  ? new Date(subscriptionData.subscription_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Dec 15'
                }
              </div>
              <p className="text-xs text-muted-foreground">Next payment due</p>
              {subscriptionData?.trial_active && (
                <Badge variant="outline" className="mt-2 bg-blue-100 text-blue-700">
                  Trial Active
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Plan Upgrade Options */}
        {currentPlan !== 'pro' && (
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription>
                Get more features and higher limits with an upgraded plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {currentPlan === 'starter' && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Growth Plan</h3>
                      <Badge variant="outline">Popular</Badge>
                    </div>
                    <p className="text-2xl font-bold mb-2">$79/month</p>
                    <p className="text-sm text-muted-foreground mb-4">Up to 500 returns/month</p>
                    <Button 
                      onClick={() => handleUpgradePlan('growth')} 
                      disabled={actionLoading}
                      className="w-full"
                    >
                      Upgrade to Growth
                    </Button>
                  </div>
                )}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Pro Plan</h3>
                    <Badge variant="outline">Best Value</Badge>
                  </div>
                  <p className="text-2xl font-bold mb-2">$149/month</p>
                  <p className="text-sm text-muted-foreground mb-4">Unlimited returns processing</p>
                  <Button 
                    onClick={() => handleUpgradePlan('pro')} 
                    disabled={actionLoading}
                    className="w-full"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Your billing history and payment records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock invoice data - in real app, this would come from Stripe/billing_records */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Invoice #INV-001</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-medium">{planDetails.price}</p>
                    <Badge variant="outline" className="text-green-600">Paid</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Invoice #INV-002</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-medium">{planDetails.price}</p>
                    <Badge variant="outline" className="text-green-600">Paid</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!subscriptionData?.subscribed && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No billing history available</p>
                  <p className="text-sm">Invoices will appear here after your first payment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Billing;