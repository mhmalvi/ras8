
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
    <div className="space-y-8">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Advanced Analytics</h2>
          <p className="text-slate-600">Real-time insights and predictive analytics</p>
        </div>
        <Button 
          onClick={() => loadMetrics(true)} 
          variant="outline" 
          disabled={refreshing}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Returns"
          value={metrics.totalReturns.toString()}
          description={`${metrics.returnRate.toFixed(1)}% of total orders`}
          trend={{
            direction: metrics.monthOverMonthGrowth.returns > 0 ? 'up' : metrics.monthOverMonthGrowth.returns < 0 ? 'down' : 'neutral',
            value: formatPercent(metrics.monthOverMonthGrowth.returns),
            period: 'vs last month'
          }}
          icon={<BarChart3 className="h-4 w-4" />}
          variant={metrics.monthOverMonthGrowth.returns > 10 ? 'warning' : 'default'}
        />

        <MetricCard
          title="Exchanges vs Refunds"
          value={`${metrics.totalExchanges}/${metrics.totalRefunds}`}
          description={`${((metrics.totalExchanges / (metrics.totalExchanges + metrics.totalRefunds)) * 100).toFixed(1)}% exchange rate`}
          trend={{
            direction: metrics.monthOverMonthGrowth.exchanges > 0 ? 'up' : 'down',
            value: formatPercent(metrics.monthOverMonthGrowth.exchanges),
            period: 'vs last month'
          }}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />

        <MetricCard
          title="AI Acceptance Rate"
          value={`${metrics.aiAcceptanceRate.toFixed(1)}%`}
          description="AI suggestions accepted"
          icon={<Brain className="h-4 w-4" />}
          variant={metrics.aiAcceptanceRate > 70 ? 'success' : metrics.aiAcceptanceRate < 50 ? 'warning' : 'default'}
        />

        <MetricCard
          title="Revenue Impact"
          value={formatCurrency(metrics.revenueImpact)}
          description="Retained through exchanges"
          trend={{
            direction: metrics.monthOverMonthGrowth.revenue > 0 ? 'up' : 'down',
            value: formatPercent(metrics.monthOverMonthGrowth.revenue),
            period: 'vs last month'
          }}
          icon={<DollarSign className="h-4 w-4" />}
          variant="success"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Processing Time"
          value={formatDays(metrics.averageProcessingTime)}
          description="Time to resolution"
          icon={<Clock className="h-4 w-4" />}
          variant={metrics.averageProcessingTime > 5 ? 'warning' : 'success'}
        />

        <MetricCard
          title="Customer Satisfaction"
          value={`${metrics.customerSatisfactionScore.toFixed(0)}%`}
          description="Based on exchanges & AI acceptance"
          icon={<Users className="h-4 w-4" />}
          variant={metrics.customerSatisfactionScore > 80 ? 'success' : metrics.customerSatisfactionScore < 60 ? 'warning' : 'default'}
        />

        <MetricCard
          title="Return Rate"
          value={`${metrics.returnRate.toFixed(2)}%`}
          description="Of total orders"
          icon={<Target className="h-4 w-4" />}
          variant={metrics.returnRate > 15 ? 'danger' : metrics.returnRate > 10 ? 'warning' : 'success'}
        />

        <MetricCard
          title="Predicted Next Month"
          value={metrics.predictiveInsights.nextMonthReturns.toString()}
          description="Forecasted returns"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <Separator />

      {/* Trend Chart */}
      <TrendChart
        title="Seasonal Return Trends (6 Months)"
        data={metrics.seasonalTrends}
        type="line"
      />

      <Separator />

      {/* Insights Panel */}
      <InsightsPanel
        insights={metrics.predictiveInsights}
        topReasons={metrics.topReturnReasons}
      />
    </div>
  );
};

export default RealDashboardStats;
