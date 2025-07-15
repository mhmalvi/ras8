
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MasterAdminLayout from "@/components/MasterAdminLayout";
import { Activity, Shield, AlertTriangle, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

const ApiMonitorPage = () => {
  const apiEndpoints = [
    { name: "/api/returns", status: "healthy", responseTime: "124ms", requests: "2.3k" },
    { name: "/api/auth", status: "healthy", responseTime: "89ms", requests: "1.8k" },
    { name: "/api/merchants", status: "warning", responseTime: "345ms", requests: "456" },
    { name: "/api/webhooks", status: "healthy", responseTime: "67ms", requests: "892" },
    { name: "/api/analytics", status: "error", responseTime: "timeout", requests: "234" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800", 
      error: "bg-red-100 text-red-800"
    };
    return <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  return (
    <MasterAdminLayout 
      title="API Monitor" 
      description="Monitor API endpoints, performance metrics, and system health"
    >
      <div className="space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5.2k</div>
              <p className="text-xs text-muted-foreground">+12% from last hour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">145ms</div>
              <p className="text-xs text-muted-foreground">-5ms from last hour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.2%</div>
              <p className="text-xs text-muted-foreground">+0.1% from last hour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">2 warnings, 1 error</p>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Endpoints Status
            </CardTitle>
            <CardDescription>
              Real-time monitoring of all API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(endpoint.status)}
                    <div>
                      <p className="font-medium">{endpoint.name}</p>
                      <p className="text-sm text-muted-foreground">{endpoint.requests} requests/hour</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{endpoint.responseTime}</p>
                      <p className="text-xs text-muted-foreground">avg response</p>
                    </div>
                    {getStatusBadge(endpoint.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-4 w-4 text-red-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">API Analytics Endpoint Down</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago • Timeout after 30s</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">High Response Time Detected</p>
                  <p className="text-xs text-muted-foreground">8 minutes ago • /api/merchants averaging 345ms</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MasterAdminLayout>
  );
};

export default ApiMonitorPage;
