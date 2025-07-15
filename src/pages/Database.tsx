
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import MasterAdminLayout from "@/components/MasterAdminLayout";
import { 
  Database, 
  Shield, 
  AlertTriangle, 
  Server,
  HardDrive,
  Activity,
  Users,
  RefreshCw,
  Download,
  Upload,
  Clock,
  CheckCircle,
  Zap
} from "lucide-react";

const DatabasePage = () => {
  const [loading, setLoading] = useState(false);
  
  const tableStats = [
    { name: 'merchants', rows: 147, size: '2.4 MB', status: 'healthy' },
    { name: 'returns', rows: 3420, size: '18.2 MB', status: 'healthy' },
    { name: 'return_items', rows: 8934, size: '45.1 MB', status: 'healthy' },
    { name: 'ai_suggestions', rows: 2103, size: '12.8 MB', status: 'healthy' },
    { name: 'analytics_events', rows: 15678, size: '89.3 MB', status: 'healthy' },
  ];

  const recentQueries = [
    { query: 'SELECT COUNT(*) FROM returns WHERE status = ?', duration: '12ms', timestamp: new Date() },
    { query: 'UPDATE merchants SET last_active = ? WHERE id = ?', duration: '8ms', timestamp: new Date(Date.now() - 60000) },
    { query: 'INSERT INTO analytics_events (event_type, merchant_id, ...)', duration: '15ms', timestamp: new Date(Date.now() - 120000) },
  ];

  const handleBackup = async () => {
    setLoading(true);
    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <MasterAdminLayout 
      title="🗄️ Database Management" 
      description="Database administration and monitoring (Master Admin Only)"
    >
      <div className="space-y-6">
        {/* Security Warning */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Shield className="h-5 w-5" />
              Master Admin Database Console
            </CardTitle>
            <CardDescription className="text-amber-700">
              Direct database access and administration tools - Handle with extreme caution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Database operations require elevated privileges</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Database Overview</TabsTrigger>
            <TabsTrigger value="tables">Table Management</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          </TabsList>

          {/* Database Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900">Total Size</h3>
                  <p className="text-2xl font-bold text-blue-800">247 MB</p>
                  <p className="text-xs text-blue-600">Production DB</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                <CardContent className="p-4 text-center">
                  <Server className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-900">Connections</h3>
                  <p className="text-2xl font-bold text-green-800">23/100</p>
                  <p className="text-xs text-green-600">Active Pool</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-900">Transactions</h3>
                  <p className="text-2xl font-bold text-purple-800">1,247</p>
                  <p className="text-xs text-purple-600">Per minute</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-orange-900">Performance</h3>
                  <p className="text-2xl font-bold text-orange-800">98.5%</p>
                  <p className="text-xs text-orange-600">Query Success</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Database Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {recentQueries.map((query, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <div className="flex-1 font-mono text-sm">
                          <div className="text-slate-800 truncate">{query.query}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Duration: {query.duration} • {query.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {query.duration}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Table Management */}
          <TabsContent value="tables" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Table Statistics
                </CardTitle>
                <CardDescription>
                  Overview of all tables in the production database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tableStats.map((table) => (
                    <div key={table.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Database className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{table.name}</h4>
                          <p className="text-sm text-slate-600">{table.rows.toLocaleString()} rows</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={table.status === 'healthy' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {table.status}
                          </Badge>
                          <span className="text-sm font-medium">{table.size}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Database Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Query Performance</span>
                        <span className="font-semibold">92%</span>
                      </div>
                      <Progress value={92} className="h-3" />
                      <p className="text-xs text-slate-600 mt-1">Average query execution time: 45ms</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Index Efficiency</span>
                        <span className="font-semibold">88%</span>
                      </div>
                      <Progress value={88} className="h-3" />
                      <p className="text-xs text-slate-600 mt-1">Index hit ratio is optimal</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Connection Pool</span>
                        <span className="font-semibold">23%</span>
                      </div>
                      <Progress value={23} className="h-3" />
                      <p className="text-xs text-slate-600 mt-1">23 of 100 connections active</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Cache Hit Rate</span>
                        <span className="font-semibold">95%</span>
                      </div>
                      <Progress value={95} className="h-3" />
                      <p className="text-xs text-slate-600 mt-1">Excellent cache performance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup & Restore */}
          <TabsContent value="backup" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Download className="h-5 w-5" />
                    Database Backup
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Create a full backup of the production database
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>Last backup: 2 hours ago</span>
                  </div>
                  <Button 
                    onClick={handleBackup} 
                    disabled={loading} 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Create Backup
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Upload className="h-5 w-5" />
                    Database Restore
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Restore database from a previous backup
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <HardDrive className="h-4 w-4" />
                    <span>Available backups: 7</span>
                  </div>
                  <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Select Backup File
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Backup History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Backup History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((backup) => (
                    <div key={backup} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <HardDrive className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">backup_2024_01_12_{backup.toString().padStart(2, '0')}.sql</p>
                          <p className="text-sm text-slate-600">Size: 247 MB • {backup * 2} hours ago</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MasterAdminLayout>
  );
};

export default DatabasePage;
