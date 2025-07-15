
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MasterAdminLayout from "@/components/MasterAdminLayout";
import { 
  Bug, 
  Code, 
  Database, 
  Network,
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Terminal,
  Zap,
  Activity,
  Settings
} from "lucide-react";

const DebugPanel = () => {
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    api: 'operational',
    database: 'operational',
    cache: 'operational',
    queue: 'operational'
  });

  const [debugLogs, setDebugLogs] = useState([
    { id: 1, level: 'info', message: 'System initialization complete', timestamp: new Date(), component: 'Core' },
    { id: 2, level: 'warning', message: 'High memory usage detected', timestamp: new Date(Date.now() - 300000), component: 'Memory' },
    { id: 3, level: 'error', message: 'API timeout on external service', timestamp: new Date(Date.now() - 600000), component: 'API' },
    { id: 4, level: 'info', message: 'Database connection pool refreshed', timestamp: new Date(Date.now() - 900000), component: 'Database' },
  ]);

  const refreshSystemStatus = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSystemStatus({
      api: 'operational',
      database: 'operational', 
      cache: 'operational',
      queue: 'operational'
    });
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <MasterAdminLayout 
      title="🐛 Debug Panel" 
      description="System debugging and diagnostic tools (Master Admin Only)"
    >
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bug className="h-5 w-5" />
              Debug Console
            </CardTitle>
            <CardDescription className="text-orange-700">
              Advanced debugging tools and system diagnostics for troubleshooting
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Master Admin Access Required</span>
            </div>
            <Button onClick={refreshSystemStatus} disabled={loading} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="logs">Debug Logs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="tools">Debug Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Network className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900">API Services</h3>
                  <Badge className={`mt-2 ${getStatusColor(systemStatus.api)}`}>
                    {systemStatus.api}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-900">Database</h3>
                  <Badge className={`mt-2 ${getStatusColor(systemStatus.database)}`}>
                    {systemStatus.database}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-900">Cache Layer</h3>
                  <Badge className={`mt-2 ${getStatusColor(systemStatus.cache)}`}>
                    {systemStatus.cache}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-orange-900">Queue System</h3>
                  <Badge className={`mt-2 ${getStatusColor(systemStatus.queue)}`}>
                    {systemStatus.queue}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  System Diagnostics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">99.9%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">145ms</div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">2.1k</div>
                    <div className="text-sm text-gray-600">Requests/min</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Debug Logs
                </CardTitle>
                <CardDescription>
                  Real-time system logs and debug information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-2">
                    {debugLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 font-mono text-sm">
                        <Badge className={getLevelColor(log.level)} variant="secondary">
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-gray-500 text-xs">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.component}
                        </Badge>
                        <span className="flex-1">{log.message}</span>
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
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">CPU Usage</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                    <p className="text-sm text-gray-600">45% utilization</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Memory Usage</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '67%'}}></div>
                    </div>
                    <p className="text-sm text-gray-600">67% allocated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Debug Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start gap-2 h-12">
                    <Database className="h-4 w-4" />
                    Test Database Connection
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-12">
                    <Network className="h-4 w-4" />
                    Check API Endpoints
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-12">
                    <Zap className="h-4 w-4" />
                    Clear Cache
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-12">
                    <RefreshCw className="h-4 w-4" />
                    Restart Services
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MasterAdminLayout>
  );
};

export default DebugPanel;
