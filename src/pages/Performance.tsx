
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TrendingUp, TrendingDown, Target, Zap } from "lucide-react";

const Performance = () => {
  const metrics = [
    {
      title: "Response Time",
      value: "2.4 hours",
      target: "< 4 hours",
      progress: 85,
      trend: "up",
      color: "green"
    },
    {
      title: "Customer Satisfaction",
      value: "94%",
      target: "> 90%",
      progress: 94,
      trend: "up",
      color: "green"
    },
    {
      title: "Exchange Rate",
      value: "68%",
      target: "> 60%",
      progress: 68,
      trend: "up",
      color: "blue"
    },
    {
      title: "Processing Efficiency",
      value: "89%",
      target: "> 85%",
      progress: 89,
      trend: "down",
      color: "yellow"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Performance Metrics</h1>
                <p className="text-sm text-slate-500">Track key performance indicators</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
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
                            "bg-yellow-50 text-yellow-700"
                          }
                        >
                          {metric.trend === "up" ? "↗" : "↘"} {metric.progress}%
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
                      <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Achieve 95% customer satisfaction rate</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700">On Track</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Target className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Increase exchange rate to 75%</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700">Planning</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Performance;
