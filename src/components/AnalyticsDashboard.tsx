
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
          value={`${analytics?.exchangeRate || 0}%`}
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
          value={`$${analytics?.revenueRetained || 0}`}
          description="Through exchanges"
          trend="up"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Return Reasons</CardTitle>
            <CardDescription>Most common reasons for returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.topReasons?.map((reason, index) => (
                <div key={reason.reason} className="flex justify-between">
                  <span className="text-sm">{reason.reason}</span>
                  <span className="text-sm font-semibold">{reason.count}</span>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest return processing events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{activity.description}</span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
