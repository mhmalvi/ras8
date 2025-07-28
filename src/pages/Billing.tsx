import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingUp, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Billing = () => {
  const { subscriptionData, loading, openCustomerPortal, createCheckout } = useSubscription();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleUpgradePlan = async () => {
    setActionLoading(true);
    try {
      await createCheckout('pro');
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
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and billing information</p>
          </div>
          <Button onClick={handleUpdatePayment} disabled={actionLoading}>
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Update Payment Method
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <Badge variant="default">Pro</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptionData.plan_type === 'pro' ? '$149' : 
                 subscriptionData.plan_type === 'growth' ? '$79' : '$29'}/month
              </div>
              <p className="text-xs text-muted-foreground">
                {subscriptionData.plan_type === 'pro' ? 'Unlimited returns processing' :
                 subscriptionData.plan_type === 'growth' ? 'Up to 500 returns/month' : 'Up to 100 returns/month'}
              </p>
              {subscriptionData.plan_type !== 'pro' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUpgradePlan}
                  disabled={actionLoading}
                  className="mt-2"
                >
                  Upgrade Plan
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Dec 15</div>
              <p className="text-xs text-muted-foreground">Next payment due</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">of plan limits used</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Your billing history and payment records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Invoice #INV-001</p>
                  <p className="text-sm text-muted-foreground">Nov 15, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$149.00</p>
                  <Badge variant="outline" className="text-green-600">Paid</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Invoice #INV-002</p>
                  <p className="text-sm text-muted-foreground">Oct 15, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$149.00</p>
                  <Badge variant="outline" className="text-green-600">Paid</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Billing;