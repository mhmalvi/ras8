
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Calendar, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";

const SubscriptionStatus = () => {
  const { subscriptionData, loading, checkSubscription, openCustomerPortal } = useSubscription();

  const getPlanDisplayName = (planType: string) => {
    const plans = {
      starter: 'Starter',
      growth: 'Growth',
      pro: 'Pro'
    };
    return plans[planType as keyof typeof plans] || planType;
  };

  const getPlanPrice = (planType: string) => {
    const prices = {
      starter: '$29',
      growth: '$79',
      pro: '$149'
    };
    return prices[planType as keyof typeof prices] || '$0';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </CardTitle>
            <CardDescription>
              Manage your billing and subscription
            </CardDescription>
          </div>
          <Button
            onClick={checkSubscription}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-lg">
              {getPlanDisplayName(subscriptionData.plan_type)} Plan
            </h3>
            <p className="text-slate-600">
              {getPlanPrice(subscriptionData.plan_type)}/month
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {subscriptionData.subscribed ? (
              <Badge className="bg-green-500">Active</Badge>
            ) : (
              <Badge variant="outline">Not Active</Badge>
            )}
            {subscriptionData.trial_active && (
              <Badge className="bg-orange-500">Free Trial</Badge>
            )}
          </div>
        </div>

        {subscriptionData.subscription_end && (
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            <span>
              {subscriptionData.trial_active ? 'Trial ends' : 'Next billing'}: {' '}
              {format(new Date(subscriptionData.subscription_end), 'MMM dd, yyyy')}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={openCustomerPortal}
            disabled={!subscriptionData.subscribed}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
          
          {!subscriptionData.subscribed && (
            <p className="text-xs text-center text-slate-500">
              Subscribe to a plan to manage your subscription
            </p>
          )}
        </div>

        {subscriptionData.trial_active && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              🎉 You're currently on a 14-day free trial! No charges until your trial ends.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
