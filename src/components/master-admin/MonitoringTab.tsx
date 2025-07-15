import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";

const MonitoringTab = () => {
  const realtimeMetrics = [
    { name: 'Active Users', value: '1,247', change: '+5.2%', trend: 'up' },
    { name: 'API Requests/min', value: '2,104', change: '+12.3%', trend: 'up' },
    { name: 'Error Rate', value: '0.1%', change: '-2.1%', trend: 'down' },
    { name: 'Avg Response Time', value: '145ms', change: '-8.5%', trend: 'down' },
  ];

  const systemAlerts = [
    { id: 1, level: 'warning', message: 'High memory usage detected on server-02', timestamp: '2 minutes ago', component: 'Infrastructure' },
    { id: 2, level: 'info', message: 'Database backup completed successfully', timestamp: '15 minutes ago', component: 'Database' },
    { id: 3, level: 'error', message: 'API endpoint /webhooks/shopify timeout', timestamp: '1 hour ago', component: 'API' },
    { id: 4, level: 'info', message: 'Cache layer cleared and refreshed', timestamp: '2 hours ago', component: 'Cache' },
  ];

  const activityLogs = [
    { id: 1, action: 'User Login', user: 'aalvi.hm@gmail.com', timestamp: '1 minute ago', status: 'success' },
    { id: 2, action: 'Return Processed', user: 'system', timestamp: '3 minutes ago', status: 'success' },
    { id: 3, action: 'Webhook Received', user: 'shopify', timestamp: '5 minutes ago', status: 'success' },
    { id: 4, action: 'AI Suggestion Generated', user: 'system', timestamp: '8 minutes ago', status: 'success' },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return CheckCircle;
      default: return CheckCircle;
    }
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Monitoring</h1>
        <p className="text-slate-600">Real-time system monitoring and alerts</p>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {realtimeMetrics.map((metric) => (
          <Card key={metric.name} className="bg-gradient-to-br from-white to-slate-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-slate-500" />
                <TrendingUp className={`h-4 w-4 ${getTrendColor(metric.trend)}`} />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{metric.name}</h3>
              <p className="text-2xl font-bold text-slate-800 mt-1">{metric.value}</p>
              <p className={`text-xs mt-1 ${getTrendColor(metric.trend)}`}>
                {metric.change} from last hour
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent System Alerts
              </CardTitle>
              <CardDescription>
                Monitor system health and critical events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {systemAlerts.map((alert) => {
                    const LevelIcon = getLevelIcon(alert.level);
                    return (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                        <LevelIcon className={`h-5 w-5 mt-0.5 ${alert.level === 'error' ? 'text-red-500' : alert.level === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getLevelColor(alert.level)}>
                              {alert.level.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.component}
                            </Badge>
                            <span className="text-xs text-slate-500 ml-auto">{alert.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-800">{alert.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>
                Track user actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{log.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.user}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                      <Badge className="text-green-600 bg-green-100">
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Performance charts and detailed metrics coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringTab;