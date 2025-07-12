import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { RealTimeAnalyticsService, type RealTimeAnalytics } from "@/services/realTimeAnalyticsService";

const RealDashboardStats = () => {
  const { profile } = useMerchantProfile();
  const [analytics, setAnalytics] = useState<RealTimeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.merchant_id) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    let channel: any;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await RealTimeAnalyticsService.getAnalytics(profile.merchant_id);
        setAnalytics(data);
        
        // Set up real-time subscription
        channel = await RealTimeAnalyticsService.subscribeToUpdates(
          profile.merchant_id,
          (updatedAnalytics) => {
            console.log('📊 Real-time analytics update received');
            setAnalytics(updatedAnalytics);
          }
        );
        
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [profile?.merchant_id]);

  const calculateTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; value: string } => {
    if (previous === 0) return { trend: 'neutral', value: 'No data' };
    
    const change = ((current - previous) / previous) * 100;
    const absChange = Math.abs(change);
    
    if (absChange < 1) return { trend: 'neutral', value: '0%' };
    
    return {
      trend: change > 0 ? 'up' : 'down',
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600 text-sm">Error loading stats: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate trends from current vs previous month
  const currentMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 1];
  const previousMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 2];

  const returnsTrend = calculateTrend(
    currentMonth?.returns || 0,
    previousMonth?.returns || 0
  );

  const exchangesTrend = calculateTrend(
    currentMonth?.exchanges || 0,
    previousMonth?.exchanges || 0
  );

  const revenueTrend = calculateTrend(
    currentMonth?.revenue || 0,
    previousMonth?.revenue || 0
  );

  const aiTrend = analytics.aiAcceptanceRate >= 80 ? 
    { trend: 'up' as const, value: 'Above target' } : 
    { trend: 'down' as const, value: 'Below target' };

  const stats = [
    {
      title: "Total Returns",
      value: analytics.totalReturns.toString(),
      description: `${analytics.returnsByStatus.requested} pending approval`,
      icon: RefreshCw,
      trend: returnsTrend.trend,
      trendValue: returnsTrend.value
    },
    {
      title: "Exchanges",
      value: analytics.totalExchanges.toString(),
      description: `${analytics.totalReturns > 0 ? 
        ((analytics.totalExchanges / analytics.totalReturns) * 100).toFixed(1) : 0}% exchange rate`,
      icon: TrendingUp,
      trend: exchangesTrend.trend,
      trendValue: exchangesTrend.value
    },
    {
      title: "AI Acceptance",
      value: `${analytics.aiAcceptanceRate}%`,
      description: "AI suggestions accepted",
      icon: Sparkles,
      trend: aiTrend.trend,
      trendValue: aiTrend.value
    },
    {
      title: "Revenue Retained",
      value: formatCurrency(analytics.revenueImpact),
      description: "Through exchanges",
      icon: DollarSign,
      trend: revenueTrend.trend,
      trendValue: revenueTrend.value
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`flex items-center space-x-1 text-xs ${
                stat.trend === "up" 
                  ? "text-green-600" 
                  : stat.trend === "down" 
                    ? "text-red-600" 
                    : "text-slate-500"
              }`}>
                {stat.trend === "up" && <TrendingUp className="h-3 w-3" />}
                {stat.trend === "down" && <TrendingDown className="h-3 w-3" />}
                <span>{stat.trendValue}</span>
              </div>
              <span className="text-xs text-slate-500">from last month</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RealDashboardStats;
