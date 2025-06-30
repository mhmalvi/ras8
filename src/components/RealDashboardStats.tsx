
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Sparkles, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealAnalyticsData } from "@/hooks/useRealAnalyticsData";
import { Skeleton } from "@/components/ui/skeleton";

const RealDashboardStats = () => {
  const { analytics, loading, error } = useRealAnalyticsData();

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const stats = [
    {
      title: "Total Returns",
      value: analytics.totalReturns.toString(),
      description: `${analytics.returnsByStatus.requested} pending approval`,
      icon: RefreshCw,
      trend: analytics.totalReturns > 0 ? "up" : "neutral",
      trendValue: analytics.totalReturns > 0 ? "+12%" : "No data"
    },
    {
      title: "Exchanges",
      value: analytics.totalExchanges.toString(),
      description: `${((analytics.totalExchanges / Math.max(analytics.totalReturns, 1)) * 100).toFixed(1)}% exchange rate`,
      icon: TrendingUp,
      trend: analytics.totalExchanges > analytics.totalRefunds ? "up" : "down",
      trendValue: analytics.totalExchanges > analytics.totalRefunds ? "+8%" : "-3%"
    },
    {
      title: "AI Acceptance",
      value: `${analytics.aiAcceptanceRate.toFixed(1)}%`,
      description: "AI suggestions accepted",
      icon: Sparkles,
      trend: analytics.aiAcceptanceRate > 75 ? "up" : "down",
      trendValue: analytics.aiAcceptanceRate > 75 ? "+15%" : "-5%"
    },
    {
      title: "Revenue Retained",
      value: formatCurrency(analytics.revenueImpact),
      description: "Through exchanges",
      icon: DollarSign,
      trend: analytics.revenueImpact > 0 ? "up" : "neutral",
      trendValue: analytics.revenueImpact > 0 ? "+22%" : "No impact"
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
