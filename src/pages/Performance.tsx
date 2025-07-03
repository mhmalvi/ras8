
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Target, Zap, RefreshCw } from "lucide-react";
import { usePerformanceData } from "@/hooks/usePerformanceData";

const Performance = () => {
  const { performanceData, loading, error, refetch } = usePerformanceData();

  // Convert performance data to metrics array for rendering
  const metrics = performanceData ? [
    {
      title: "Response Time",
      value: performanceData.responseTime.value,
      target: performanceData.responseTime.target,
      progress: performanceData.responseTime.progress,
      trend: performanceData.responseTime.trend,
      color: performanceData.responseTime.color
    },
    {
      title: "Customer Satisfaction",
      value: performanceData.customerSatisfaction.value,
      target: performanceData.customerSatisfaction.target,
      progress: performanceData.customerSatisfaction.progress,
      trend: performanceData.customerSatisfaction.trend,
      color: performanceData.customerSatisfaction.color
    },
    {
      title: "Exchange Rate",
      value: performanceData.exchangeRate.value,
      target: performanceData.exchangeRate.target,
      progress: performanceData.exchangeRate.progress,
      trend: performanceData.exchangeRate.trend,
      color: performanceData.exchangeRate.color
    },
    {
      title: "Processing Efficiency",
      value: performanceData.processingEfficiency.value,
      target: performanceData.processingEfficiency.target,
      progress: performanceData.processingEfficiency.progress,
      trend: performanceData.processingEfficiency.trend,
      color: performanceData.processingEfficiency.color
    }
  ] : [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Performance Metrics</h1>
                  <p className="text-sm text-slate-500">
                    {loading ? (
                      "Loading performance data..."
                    ) : error ? (
                      `Error: ${error}`
                    ) : (
                      "Real-time performance indicators from database"
                    )}
                  </p>
                </div>
              </div>
              <Button
                onClick={refetch}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {[...Array(4)].map((_, index) => (
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-24 mb-2" />
                        <div className="flex items-center justify-between mb-3">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">Failed to load performance data: {error}</p>
                  <Button onClick={refetch} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : metrics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No performance data available. Metrics will appear here once you start processing returns.</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {metrics.map((metric, index) => (
                      <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                          {metric.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold mb-2">{metric.value}</div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-slate-500">Target: {metric.target}</span>
                            <Badge 
                              variant="outline" 
                              className={
                                metric.color === "green" ? "bg-green-50 text-green-700" :
                                metric.color === "blue" ? "bg-blue-50 text-blue-700" :
                                metric.color === "yellow" ? "bg-yellow-50 text-yellow-700" :
                                "bg-red-50 text-red-700"
                              }
                            >
                              {metric.trend === "up" ? "↗" : "↘"} {Math.round(metric.progress)}%
                            </Badge>
                          </div>
                          <Progress value={metric.progress} className="h-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Performance Goals
                      </CardTitle>
                      <CardDescription>Key objectives for this quarter</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Target className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Reduce average response time to under 2 hours</span>
                          </div>
                          <Badge className={
                            parseFloat(performanceData.responseTime.value) < 2 
                              ? "bg-green-100 text-green-700" 
                              : "bg-blue-100 text-blue-700"
                          }>
                            {parseFloat(performanceData.responseTime.value) < 2 ? "Achieved" : "In Progress"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Target className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Achieve 95% customer satisfaction rate</span>
                          </div>
                          <Badge className={
                            parseFloat(performanceData.customerSatisfaction.value) >= 95 
                              ? "bg-green-100 text-green-700" 
                              : "bg-yellow-100 text-yellow-700"
                          }>
                            {parseFloat(performanceData.customerSatisfaction.value) >= 95 ? "Achieved" : "On Track"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Target className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Increase exchange rate to 75%</span>
                          </div>
                          <Badge className={
                            parseFloat(performanceData.exchangeRate.value) >= 75 
                              ? "bg-green-100 text-green-700" 
                              : parseFloat(performanceData.exchangeRate.value) >= 60 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-purple-100 text-purple-700"
                          }>
                            {parseFloat(performanceData.exchangeRate.value) >= 75 
                              ? "Achieved" 
                              : parseFloat(performanceData.exchangeRate.value) >= 60 
                              ? "On Track" 
                              : "Planning"
                            }
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Performance;
