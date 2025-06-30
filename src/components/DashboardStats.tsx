
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RotateCcw, DollarSign, Users, Brain } from "lucide-react";

const DashboardStats = () => {
  const stats = [
    {
      title: "Total Returns",
      value: "2,847",
      change: "+12.5%",
      trend: "up",
      icon: RotateCcw,
      description: "vs last month"
    },
    {
      title: "Exchange Rate",
      value: "68%",
      change: "+5.2%",
      trend: "up",
      icon: TrendingUp,
      description: "customers chose exchanges"
    },
    {
      title: "Revenue Retained",
      value: "$45,230",
      change: "+18.7%",
      trend: "up",
      icon: DollarSign,
      description: "through exchanges"
    },
    {
      title: "AI Acceptance",
      value: "84%",
      change: "+2.1%",
      trend: "up",
      icon: Brain,
      description: "AI suggestions accepted"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.trend === "up";
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-3">
                <div className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </div>
                <div className={`flex items-center text-xs font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stat.description}
              </p>
            </CardContent>
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/30 pointer-events-none" />
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
