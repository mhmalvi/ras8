
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/LoadingStates";
import { usePerformanceData } from "@/hooks/usePerformanceData";
import { TrendingUp, TrendingDown, RefreshCw, Clock, Users, ArrowRightLeft, Cpu } from "lucide-react";

const Performance = () => {
  const { performanceData, loading, error, refetch } = usePerformanceData();

  const getIcon = (metricType: string) => {
    switch (metricType) {
      case 'responseTime':
        return <Clock className="h-5 w-5" />;
      case 'customerSatisfaction':
        return <Users className="h-5 w-5" />;
      case 'exchangeRate':
        return <ArrowRightLeft className="h-5 w-5" />;
      case 'processingEfficiency':
        return <Cpu className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getProgressColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
      case 'blue':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };

  const renderMetricCard = (title: string, metricKey: keyof typeof performanceData, description: string) => {
    if (!performanceData) return null;
    
    const metric = performanceData[metricKey];
    const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
    
    return (
      <Card key={metricKey}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            {getIcon(metricKey)}
            <TrendIcon className={`h-4 w-4 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value}</div>
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Target: {metric.target}</span>
              <span>{Math.round(metric.progress)}%</span>
            </div>
            <Progress 
              value={metric.progress} 
              className="h-2"
            />
          </div>
          <Badge 
            variant="outline" 
            className={`mt-2 text-xs ${
              metric.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
              metric.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
              metric.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
              'bg-blue-100 text-blue-700 border-blue-200'
            }`}
          >
            {metric.color === 'green' ? 'Excellent' :
             metric.color === 'yellow' ? 'Good' :
             metric.color === 'red' ? 'Needs Attention' : 'Above Average'}
          </Badge>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Loading performance metrics..." />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Error loading performance data: {error}</p>
            <Button onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Performance</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor return processing performance and optimization metrics
            </p>
          </div>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderMetricCard(
            "Response Time", 
            "responseTime", 
            "Average time to process returns"
          )}
          {renderMetricCard(
            "Customer Satisfaction", 
            "customerSatisfaction", 
            "Based on exchange vs refund ratio"
          )}
          {renderMetricCard(
            "Exchange Rate", 
            "exchangeRate", 
            "Percentage of exchanges vs refunds"
          )}
          {renderMetricCard(
            "Processing Efficiency", 
            "processingEfficiency", 
            "AI acceptance and completion rate"
          )}
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Overall system performance insights</CardDescription>
          </CardHeader>
          <CardContent>
            {!performanceData ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No performance data available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Performance metrics will appear as return data is processed
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Performance</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    {Object.values(performanceData).filter(m => m.color === 'green').length >= 3 ? 'Excellent' :
                     Object.values(performanceData).filter(m => m.color === 'green').length >= 2 ? 'Good' : 'Fair'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {Object.values(performanceData).filter(m => m.color === 'green').length >= 3 
                    ? "Your return processing performance is excellent across all key metrics. Keep up the great work!"
                    : Object.values(performanceData).filter(m => m.color === 'green').length >= 2
                    ? "Good performance overall with some areas for optimization. Focus on improving lower-performing metrics."
                    : "There are opportunities to improve your return processing performance. Consider optimizing workflow and AI acceptance rates."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Performance;
