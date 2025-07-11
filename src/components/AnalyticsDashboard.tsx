
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, ShoppingCart, RefreshCw, DollarSign, Loader2, Brain } from 'lucide-react';
import { useLiveData } from '@/hooks/useLiveData';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, description, trend, icon }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-red-500" />}
          {description}
        </p>
      )}
    </CardContent>
  </Card>
);

const AnalyticsDashboard = () => {
  const { loading, error, dashboardKPIs, analyticsData } = useLiveData();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading live analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load analytics: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
        <p className="text-muted-foreground">
          Key metrics for your returns automation
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Returns"
          value={dashboardKPIs.totalReturns}
          description="Live database count"
          trend="up"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="Pending Returns"
          value={dashboardKPIs.pendingReturns}
          description="Awaiting processing"
          trend="neutral"
          icon={<RefreshCw className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="AI Acceptance"
          value={`${Math.round(dashboardKPIs.aiAcceptanceRate)}%`}
          description="Live AI suggestions"
          trend="up"
          icon={<Brain className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="Total Revenue"
          value={`$${dashboardKPIs.totalRevenue.toLocaleString()}`}
          description="From all returns"
          trend="up"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Return Status Breakdown</CardTitle>
            <CardDescription>Current status of all returns (Live Data)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.statusBreakdown.length > 0 ? (
                analyticsData.statusBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm capitalize">{item.status}</span>
                    <span className="text-sm font-semibold">{item.count} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No status data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Returns activity over time (Live Data)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.monthlyTrends.length > 0 ? (
                analyticsData.monthlyTrends.slice(-3).map((trend, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{trend.month}: {trend.returns} returns</span>
                    <span className="text-green-600">(${trend.revenue.toLocaleString()} revenue)</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No trend data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
