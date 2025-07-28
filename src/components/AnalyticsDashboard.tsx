
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
  <div className="bg-background rounded-lg border p-4 hover:shadow-sm transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <div className="text-muted-foreground">{icon}</div>
    </div>
    <div className="text-2xl font-semibold text-foreground mb-2">{value}</div>
    {description && (
      <div className="flex items-center text-xs text-muted-foreground">
        {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-emerald-600" />}
        {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-red-600" />}
        {description}
      </div>
    )}
  </div>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Returns"
          value={dashboardKPIs.totalReturns}
          description="Live database count"
          trend="up"
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Pending Returns"
          value={dashboardKPIs.pendingReturns}
          description="Awaiting processing"
          trend="neutral"
          icon={<RefreshCw className="h-4 w-4" />}
        />
        
        <MetricCard
          title="AI Acceptance"
          value={`${Math.round(dashboardKPIs.aiAcceptanceRate)}%`}
          description="AI suggestions accepted"
          trend="up"
          icon={<Brain className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Total Revenue"
          value={`$${dashboardKPIs.totalRevenue.toLocaleString()}`}
          description="From all returns"
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-background rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">Return Status</h3>
            <div className="text-xs text-muted-foreground">Live Data</div>
          </div>
          <div className="space-y-3">
            {analyticsData.statusBreakdown.length > 0 ? (
              analyticsData.statusBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm capitalize text-muted-foreground">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No status data available</p>
            )}
          </div>
        </div>

        <div className="bg-background rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">Recent Trends</h3>
            <div className="text-xs text-muted-foreground">Last 3 months</div>
          </div>
          <div className="space-y-3">
            {analyticsData.monthlyTrends.length > 0 ? (
              analyticsData.monthlyTrends.slice(-3).map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{trend.month}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{trend.returns} returns</div>
                    <div className="text-xs text-emerald-600">${trend.revenue.toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No trend data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
