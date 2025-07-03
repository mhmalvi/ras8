
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealAnalyticsData } from '@/hooks/useRealAnalyticsData';
import { TrendingUp, TrendingDown, Users, ShoppingCart, RefreshCw, DollarSign } from 'lucide-react';

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
  const { analytics, loading, error } = useRealAnalyticsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
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

  // Calculate exchange rate from available data
  const exchangeRate = analytics?.totalReturns > 0 
    ? Math.round(((analytics.totalExchanges || 0) / analytics.totalReturns) * 100)
    : 0;

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
          value={analytics?.totalReturns || 0}
          description="This month"
          trend="up"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="Exchange Rate"
          value={`${exchangeRate}%`}
          description="vs refund rate"
          trend="up"
          icon={<RefreshCw className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="AI Acceptance"
          value={`${analytics?.aiAcceptanceRate || 0}%`}
          description="Suggestions accepted"
          trend="up"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="Revenue Retained"
          value={`$${analytics?.revenueImpact || 0}`}
          description="Through exchanges"
          trend="up"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Return Status Breakdown</CardTitle>
            <CardDescription>Current status of all returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.returnsByStatus ? (
                Object.entries(analytics.returnsByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Returns activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.monthlyTrends?.slice(-3).map((trend, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{trend.month}: {trend.returns} returns</span>
                  {trend.exchanges > 0 && (
                    <span className="text-green-600">({trend.exchanges} exchanges)</span>
                  )}
                </div>
              )) || (
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
