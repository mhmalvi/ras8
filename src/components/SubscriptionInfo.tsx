import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { useRealBillingData } from '@/hooks/useRealBillingData';
import { Package, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SubscriptionInfoProps {
  isCollapsed?: boolean;
}

export const SubscriptionInfo = ({ isCollapsed }: SubscriptionInfoProps) => {
  const { subscriptionData, loading: subscriptionLoading } = useSubscription();
  const { usageStats, loading: billingLoading } = useRealBillingData();
  const appVersion = "v1.3.7"; // This can be moved to env or fetched from backend

  const loading = subscriptionLoading || billingLoading;

  if (loading) {
    return (
      <Card className={cn(
        "border border-border/50 bg-card/50 backdrop-blur-sm",
        isCollapsed ? "p-2 mb-2" : "p-3 mb-2"
      )}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-full mb-2" />
          {!isCollapsed && (
            <>
              <div className="h-3 bg-muted rounded w-16 mb-2" />
              <div className="h-2 bg-muted rounded w-full" />
            </>
          )}
        </div>
      </Card>
    );
  }

  const planType = subscriptionData?.plan_type || 'starter';
  const planName = planType.charAt(0).toUpperCase() + planType.slice(1);
  
  // Usage stats
  const currentUsage = usageStats?.current_usage || 0;
  const planLimit = usageStats?.plan_limit || 100;
  const usagePercentage = usageStats?.usage_percentage || 0;
  
  // Next billing date
  const nextBillingDate = subscriptionData?.subscription_end || usageStats?.period_end;
  const formattedBillingDate = nextBillingDate 
    ? format(new Date(nextBillingDate), 'MMM d, yyyy')
    : 'N/A';
  
  const getPlanIcon = () => {
    if (planType === 'pro' || planType === 'premium') {
      return <Sparkles className="h-3 w-3" />;
    }
    return <Package className="h-3 w-3" />;
  };

  const getPlanColor = () => {
    switch (planType.toLowerCase()) {
      case 'pro':
      case 'premium':
        return 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20';
      case 'growth':
        return 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20';
      default:
        return 'bg-gradient-to-r from-slate-500/10 to-gray-500/10 border-slate-500/20';
    }
  };

  if (isCollapsed) {
    return (
      <Card className={cn(
        "border border-border/50 bg-card/50 backdrop-blur-sm p-2 mb-2",
        getPlanColor()
      )}>
        <div className="flex flex-col items-center space-y-1">
          {getPlanIcon()}
          <Badge variant="outline" className="text-xs px-1 py-0">
            {planName}
          </Badge>
          {planLimit > 0 && (
            <div className="w-full">
              <Progress 
                value={usagePercentage} 
                className="h-1" 
              />
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border border-border/50 bg-card/50 backdrop-blur-sm p-3 mb-2",
      getPlanColor()
    )}>
      <div className="space-y-3">
        {/* Plan Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getPlanIcon()}
            <span className="font-medium text-sm">{planName} Plan</span>
          </div>
          {subscriptionData?.subscribed && (
            <Badge variant="default" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        
        {/* Usage Progress */}
        {planLimit > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-muted-foreground">Usage</span>
              </div>
              <span className="font-medium">{currentUsage} / {planLimit}</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={cn(
                "h-2",
                usagePercentage > 90 ? '[&>div]:bg-red-500' : 
                usagePercentage > 75 ? '[&>div]:bg-yellow-500' : 
                '[&>div]:bg-green-500'
              )}
            />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(usagePercentage)}% used this month
            </div>
          </div>
        )}
        
        {/* Next Billing & Version */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Next Billing</div>
              <div className="font-medium">{formattedBillingDate}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground">Version</div>
            <Badge variant="outline" className="text-xs">
              {appVersion}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};