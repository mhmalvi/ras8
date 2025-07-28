
import { useState, useEffect } from "react";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { AdvancedAnalyticsService, type AdvancedMetrics } from "@/services/advancedAnalyticsService";
import { MetricCard } from "@/components/analytics/MetricCard";
import { TrendChart } from "@/components/analytics/TrendChart";
import { InsightsPanel } from "@/components/analytics/InsightsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, DollarSign, TrendingUp, Brain, BarChart3, Clock, Users, Target } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const RealDashboardStats = () => {
  const { profile } = useMerchantProfile();
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async (showRefreshing = false) => {
    if (!profile?.merchant_id) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      
      const data = await AdvancedAnalyticsService.getAdvancedMetrics(profile.merchant_id);
      setMetrics(data);
      
    } catch (err) {
      console.error('Failed to load advanced metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [profile?.merchant_id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDays = (days: number) => {
    return `${days.toFixed(1)} days`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading analytics: {error}</p>
        <Button onClick={() => loadMetrics()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">Key Metrics</h2>
          <p className="text-sm text-muted-foreground">Real-time insights and analytics</p>
        </div>
        <Button 
          onClick={() => loadMetrics(true)} 
          variant="ghost" 
          disabled={refreshing}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Returns"
          value={metrics.totalReturns.toString()}
          description={`${metrics.returnRate.toFixed(1)}% of orders`}
          trend={{
            direction: metrics.monthOverMonthGrowth.returns > 0 ? 'up' : metrics.monthOverMonthGrowth.returns < 0 ? 'down' : 'neutral',
            value: formatPercent(metrics.monthOverMonthGrowth.returns),
            period: 'vs last month'
          }}
          icon={<BarChart3 className="h-4 w-4" />}
          variant={metrics.monthOverMonthGrowth.returns > 10 ? 'warning' : 'default'}
        />

        <MetricCard
          title="Exchange Rate"
          value={`${((metrics.totalExchanges / (metrics.totalExchanges + metrics.totalRefunds)) * 100).toFixed(1)}%`}
          description={`${metrics.totalExchanges} of ${metrics.totalExchanges + metrics.totalRefunds} returns`}
          trend={{
            direction: metrics.monthOverMonthGrowth.exchanges > 0 ? 'up' : 'down',
            value: formatPercent(metrics.monthOverMonthGrowth.exchanges),
            period: 'vs last month'
          }}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />

        <MetricCard
          title="AI Acceptance"
          value={`${metrics.aiAcceptanceRate.toFixed(1)}%`}
          description="AI suggestions accepted"
          icon={<Brain className="h-4 w-4" />}
          variant={metrics.aiAcceptanceRate > 70 ? 'success' : metrics.aiAcceptanceRate < 50 ? 'warning' : 'default'}
        />

        <MetricCard
          title="Revenue Retained"
          value={formatCurrency(metrics.revenueImpact)}
          description="Through exchanges"
          trend={{
            direction: metrics.monthOverMonthGrowth.revenue > 0 ? 'up' : 'down',
            value: formatPercent(metrics.monthOverMonthGrowth.revenue),
            period: 'vs last month'
          }}
          icon={<DollarSign className="h-4 w-4" />}
          variant="success"
        />
      </div>

      {/* Trend Chart */}
      <TrendChart
        title="Return Trends"
        data={metrics.seasonalTrends}
        type="line"
      />

      {/* Insights Panel */}
      <InsightsPanel
        insights={metrics.predictiveInsights}
        topReasons={metrics.topReturnReasons}
      />
    </div>
  );
};

export default RealDashboardStats;
