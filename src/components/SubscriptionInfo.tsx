import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { useRealBillingData } from '@/hooks/useRealBillingData';
import { Package, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SubscriptionInfoProps {
  isCollapsed?: boolean;
}

export const SubscriptionInfo = ({ isCollapsed }: SubscriptionInfoProps) => {
  const { subscriptionData, loading: subscriptionLoading } = useSubscription();
  const { usageStats, loading: billingLoading } = useRealBillingData();
  const navigate = useNavigate();

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
  
  const getPlanIcon = () => {
    if (planType === 'pro' || planType === 'premium') {
      return <Sparkles className="h-3 w-3" />;
    }
    return <Package className="h-3 w-3" />;
  };

  const getUsageColor = () => {
    if (usagePercentage >= 85) return 'bg-destructive';
    if (usagePercentage >= 60) return 'bg-warning';
    return 'bg-primary';
  };

  const handleClick = () => {
    navigate('/billing');
  };

  if (isCollapsed) {
    return (
      <Card 
        className="border border-border/50 bg-card/50 backdrop-blur-sm p-2 mb-2 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
        onClick={handleClick}
      >
        <div className="flex flex-col items-center space-y-1">
          {getPlanIcon()}
          <Badge variant="outline" className="text-xs px-1 py-0">
            {planName}
          </Badge>
          {planLimit > 0 && (
            <div className="w-full">
              <Progress 
                value={usagePercentage} 
                className={cn("h-1", `[&>div]:${getUsageColor()}`)}
              />
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="border border-border/50 bg-card/50 backdrop-blur-sm p-3 mb-2 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
      onClick={handleClick}
    >
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
                usagePercentage >= 85 ? '[&>div]:bg-destructive' : 
                usagePercentage >= 60 ? '[&>div]:bg-warning' : 
                '[&>div]:bg-primary'
              )}
            />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(usagePercentage)}% used this month
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};