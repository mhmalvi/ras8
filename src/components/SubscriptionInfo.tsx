import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { Package, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionInfoProps {
  isCollapsed?: boolean;
}

export const SubscriptionInfo = ({ isCollapsed }: SubscriptionInfoProps) => {
  const { subscriptionData, loading } = useSubscription();
  const appVersion = "v1.3.7"; // This can be moved to env or fetched from backend

  if (loading) {
    return (
      <Card className={cn(
        "border border-border/50 bg-card/50 backdrop-blur-sm",
        isCollapsed ? "p-2" : "p-3 mb-2"
      )}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-full mb-2" />
          {!isCollapsed && <div className="h-3 bg-muted rounded w-16" />}
        </div>
      </Card>
    );
  }

  const planType = subscriptionData.plan_type || 'starter';
  const planName = planType.charAt(0).toUpperCase() + planType.slice(1);
  
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
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border border-border/50 bg-card/50 backdrop-blur-sm p-3 mb-2",
      getPlanColor()
    )}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getPlanIcon()}
            <span className="font-medium text-sm">{planName} Plan</span>
          </div>
          {subscriptionData.subscribed && (
            <Badge variant="default" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Version</span>
          <Badge variant="outline" className="text-xs">
            {appVersion}
          </Badge>
        </div>
      </div>
    </Card>
  );
};