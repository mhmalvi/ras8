import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Database, Server, Zap, CheckCircle, AlertTriangle } from "lucide-react";

const SystemHealthTab = () => {
  const healthMetrics = [
    { name: 'Database', status: 'healthy', responseTime: '45ms', uptime: '99.9%', icon: Database },
    { name: 'API Services', status: 'healthy', responseTime: '120ms', uptime: '99.8%', icon: Server },
    { name: 'AI Services', status: 'healthy', responseTime: '1.2s', uptime: '99.5%', icon: Zap },
    { name: 'Cache Layer', status: 'healthy', responseTime: '5ms', uptime: '99.9%', icon: Activity },
  ];

  const getStatusIcon = (status: string) => {
    return status === 'healthy' ? CheckCircle : AlertTriangle;
  };

  const getStatusColor = (status: string) => {
    return status === 'healthy' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
        <p className="text-slate-600">Monitor system performance and health metrics</p>
      </div>

      {/* Health Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetrics.map((metric) => {
          const StatusIcon = getStatusIcon(metric.status);
          const IconComponent = metric.icon;
          
          return (
            <Card key={metric.name} className="bg-gradient-to-br from-white to-slate-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <IconComponent className="h-8 w-8 text-slate-600" />
                  <StatusIcon className={`h-5 w-5 ${metric.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{metric.name}</h3>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status}
                </Badge>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Response Time</span>
                    <span className="font-medium">{metric.responseTime}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Uptime</span>
                    <span className="font-medium">{metric.uptime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Query Performance</span>
                <span className="font-semibold">92%</span>
              </div>
              <Progress value={92} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Connection Pool</span>
                <span className="font-semibold">23/100</span>
              </div>
              <Progress value={23} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Cache Hit Rate</span>
                <span className="font-semibold">95%</span>
              </div>
              <Progress value={95} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>CPU Usage</span>
                <span className="font-semibold">45%</span>
              </div>
              <Progress value={45} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Memory Usage</span>
                <span className="font-semibold">67%</span>
              </div>
              <Progress value={67} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Disk Usage</span>
                <span className="font-semibold">34%</span>
              </div>
              <Progress value={34} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealthTab;