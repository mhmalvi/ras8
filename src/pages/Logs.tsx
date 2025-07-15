
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MasterAdminLayout from "@/components/MasterAdminLayout";
import { FileText, Shield, AlertTriangle, Terminal, Clock, Activity, Search, Filter } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LogsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");

  const systemLogs = [
    { id: 1, level: 'info', component: 'API', message: 'User authentication successful', timestamp: new Date(), user: 'aalvi.hm@gmail.com' },
    { id: 2, level: 'warning', component: 'Database', message: 'Connection pool approaching limit (85/100)', timestamp: new Date(Date.now() - 300000), user: 'system' },
    { id: 3, level: 'error', component: 'AI Service', message: 'OpenAI API rate limit exceeded', timestamp: new Date(Date.now() - 600000), user: 'system' },
    { id: 4, level: 'info', component: 'Webhook', message: 'Shopify webhook processed successfully', timestamp: new Date(Date.now() - 900000), user: 'system' },
    { id: 5, level: 'error', component: 'Security', message: 'Unauthorized access attempt blocked', timestamp: new Date(Date.now() - 1200000), user: 'unknown' },
    { id: 6, level: 'info', component: 'Cache', message: 'Cache cleared successfully', timestamp: new Date(Date.now() - 1500000), user: 'aalvi.hm@gmail.com' },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredLogs = systemLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.component.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <MasterAdminLayout 
      title="📝 System Logs" 
      description="System logs and audit trails (Master Admin Only)"
    >
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Shield className="h-5 w-5" />
              Master Admin Access Required
            </CardTitle>
            <CardDescription className="text-yellow-700">
              System logs contain sensitive information and are restricted to master administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Log access requires elevated privileges</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system">System Logs</TabsTrigger>
            <TabsTrigger value="security">Security Logs</TabsTrigger>
            <TabsTrigger value="api">API Logs</TabsTrigger>
            <TabsTrigger value="performance">Performance Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            {/* Search and Filter Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <select 
                    value={selectedLevel} 
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  System Activity Logs
                </CardTitle>
                <CardDescription>
                  Real-time system logs and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border">
                        <Badge className={getLevelColor(log.level)} variant="secondary">
                          {log.level.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
                          <Clock className="h-3 w-3" />
                          <span>{log.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {log.component}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono truncate">{log.message}</div>
                          <div className="text-xs text-gray-500">User: {log.user}</div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Search className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <Badge className="text-red-600 bg-red-100">ALERT</Badge>
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">5 minutes ago</span>
                    <span className="flex-1 text-sm">Unauthorized access attempt from IP 192.168.1.100</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <Badge className="text-green-600 bg-green-100">SUCCESS</Badge>
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">10 minutes ago</span>
                    <span className="flex-1 text-sm">Master admin login successful: aalvi.hm@gmail.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  API Request Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">API logs coming soon...</p>
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
                <p className="text-muted-foreground">Performance logs coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MasterAdminLayout>
  );
};

export default LogsPage;
