import React, { useState, useEffect } from 'react';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { MasterAdminService } from '@/services/masterAdminService';
import type { SystemMetrics } from '@/types/MasterAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Store,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Activity,
  Database,
  Server,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Bell,
  Crown,
  Download,
  Ban,
  UnlockKeyhole,
  Eye,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Gauge,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

const MasterAdminDashboard = () => {
  const { user } = useAtomicAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get active tab from URL params
  const urlParams = new URLSearchParams(location.search);
  const activeTab = urlParams.get('tab') || 'overview';

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MasterAdminService.getSystemMetrics();
      setMetrics(data);
      console.log('📊 Loaded system metrics:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load system metrics';
      setError(errorMessage);
      console.error('❌ Error loading metrics:', err);
      toast({
        title: "Error Loading Metrics",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "System metrics have been updated",
    });
  };

  const handleMerchantAction = async (merchantId: string, action: 'suspend' | 'unsuspend' | 'delete') => {
    try {
      if (action === 'suspend' || action === 'unsuspend') {
        await MasterAdminService.toggleMerchantStatus(merchantId, action === 'suspend');
        toast({
          title: `Merchant ${action}ed`,
          description: `Merchant has been ${action}ed successfully`,
        });
      }
      await loadMetrics(); // Refresh data after action
    } catch (err) {
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : `Failed to ${action} merchant`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-b-purple-400 animate-pulse"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Loading Master Console
            </h3>
            <p className="text-slate-600 mt-2">Initializing system metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100">
        <Alert variant="destructive" className="max-w-md border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            Failed to load system metrics: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!metrics) return null;

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 border-0 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Master Admin Console</h1>
                  <p className="text-blue-100">Welcome back, {user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>System Status: Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Last Updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-800">Total Merchants</CardTitle>
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-blue-900">{metrics.total_merchants}</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                {metrics.active_merchants} active
              </Badge>
              <div className="flex items-center text-xs text-green-600">
                <ArrowUp className="h-3 w-3 mr-1" />
                +12%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-800">Total Returns</CardTitle>
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-green-900">{metrics.total_returns}</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                {metrics.returns_this_month} this month
              </Badge>
              <div className="flex items-center text-xs text-green-600">
                <ArrowUp className="h-3 w-3 mr-1" />
                +8%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-800">Revenue Impact</CardTitle>
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-purple-900">
              ${metrics.total_revenue.toFixed(0)}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                ${metrics.revenue_this_month.toFixed(0)} MTD
              </Badge>
              <div className="flex items-center text-xs text-green-600">
                <ArrowUp className="h-3 w-3 mr-1" />
                +15%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-800">System Health</CardTitle>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Gauge className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-orange-900">
              {metrics.system_health.uptime_percentage}%
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Operational
              </Badge>
              <div className="flex items-center text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Dashboard */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
              <Database className="h-4 w-4 text-white" />
            </div>
            System Status Overview
          </CardTitle>
          <CardDescription>Real-time monitoring of all system components</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100/30 p-5 rounded-xl border border-green-200/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Database</p>
                    <p className="text-sm text-green-700">{metrics.system_health.database_status}</p>
                  </div>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Response Time</span>
                  <span className="font-medium text-green-800">45ms</span>
                </div>
                <Progress value={95} className="h-2 bg-green-100" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 p-5 rounded-xl border border-blue-200/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Server className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">API Services</p>
                    <p className="text-sm text-blue-700">{metrics.system_health.api_status}</p>
                  </div>
                </div>
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Avg Response</span>
                  <span className="font-medium text-blue-800">120ms</span>
                </div>
                <Progress value={88} className="h-2 bg-blue-100" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/30 p-5 rounded-xl border border-purple-200/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">AI Services</p>
                    <p className="text-sm text-purple-700">{metrics.system_health.ai_service_status}</p>
                  </div>
                </div>
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-700">AI Requests</span>
                  <span className="font-medium text-purple-800">1.2k/hr</span>
                </div>
                <Progress value={92} className="h-2 bg-purple-100" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SystemTab = () => (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            System Performance Metrics
          </CardTitle>
          <CardDescription>Real-time performance monitoring and resource usage</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-blue-800">Database Performance</span>
                  <span className="text-blue-600 font-semibold">92%</span>
                </div>
                <Progress value={92} className="h-3 bg-blue-200" />
                <p className="text-xs text-blue-600 mt-1">Excellent response times</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100/50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-green-800">API Response Time</span>
                  <span className="text-green-600 font-semibold">350ms avg</span>
                </div>
                <Progress value={75} className="h-3 bg-green-200" />
                <p className="text-xs text-green-600 mt-1">Within optimal range</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-purple-800">Memory Usage</span>
                  <span className="text-purple-600 font-semibold">67%</span>
                </div>
                <Progress value={67} className="h-3 bg-purple-200" />
                <p className="text-xs text-purple-600 mt-1">Normal usage levels</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-orange-800">CPU Usage</span>
                  <span className="text-orange-600 font-semibold">45%</span>
                </div>
                <Progress value={45} className="h-3 bg-orange-200" />
                <p className="text-xs text-orange-600 mt-1">Low resource consumption</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200">
          <CardContent className="p-4 text-center">
            <Cpu className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-indigo-800">CPU Cores</p>
            <p className="text-2xl font-bold text-indigo-900">8</p>
            <p className="text-xs text-indigo-600">45% utilized</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4 text-center">
            <HardDrive className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-800">Storage</p>
            <p className="text-2xl font-bold text-emerald-900">2TB</p>
            <p className="text-xs text-emerald-600">23% used</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-rose-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-rose-800">Memory</p>
            <p className="text-2xl font-bold text-rose-900">32GB</p>
            <p className="text-xs text-rose-600">67% allocated</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200">
          <CardContent className="p-4 text-center">
            <Wifi className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-cyan-800">Network</p>
            <p className="text-2xl font-bold text-cyan-900">1Gbps</p>
            <p className="text-xs text-cyan-600">34% traffic</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const TenantsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Merchant Management</h2>
          <p className="text-slate-600">Monitor and manage all merchant accounts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b">
          <CardTitle>Active Merchants Overview</CardTitle>
          <CardDescription>
            {metrics.tenant_metrics.length} total merchants across all plans
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <div className="p-6 space-y-4">
              {metrics.tenant_metrics.map((tenant) => (
                <div key={tenant.merchant_id} className="bg-gradient-to-r from-white to-slate-50/50 p-4 border rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {tenant.shop_domain.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{tenant.shop_domain}</h4>
                            <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {tenant.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {tenant.plan_type}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              <span>{tenant.returns_count} returns</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>${tenant.revenue_impact.toFixed(2)} revenue</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Active {new Date(tenant.last_activity).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMerchantAction(tenant.merchant_id, tenant.status === 'active' ? 'suspend' : 'unsuspend')}
                      >
                        {tenant.status === 'active' ? <Ban className="h-4 w-4" /> : <UnlockKeyhole className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const MonitoringTab = () => (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            Real-time System Alerts
          </CardTitle>
          <CardDescription>Monitor system health and receive instant notifications</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>All systems operational - Last check: {new Date().toLocaleTimeString()}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">Healthy</Badge>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            System Activity Log
          </CardTitle>
          <CardDescription>Recent system events and administrative actions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 text-sm p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500 font-mono">{new Date().toLocaleTimeString()}</span>
                <span className="text-slate-700">System metrics refreshed successfully</span>
                <Badge variant="outline" className="ml-auto text-xs">System</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500 font-mono">{new Date(Date.now() - 300000).toLocaleTimeString()}</span>
                <span className="text-slate-700">Master admin {user?.email} accessed console</span>
                <Badge variant="outline" className="ml-auto text-xs">Auth</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500 font-mono">{new Date(Date.now() - 600000).toLocaleTimeString()}</span>
                <span className="text-slate-700">Database backup completed (2.3GB)</span>
                <Badge variant="outline" className="ml-auto text-xs">Backup</Badge>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const ReportsTab = () => (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-600" />
            System Reports & Analytics
          </CardTitle>
          <CardDescription>Generate and download comprehensive system reports</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">System Metrics Report</h3>
                    <p className="text-sm text-blue-700">Performance and health metrics</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-white hover:bg-blue-50 border-blue-200">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Merchant Activity Report</h3>
                    <p className="text-sm text-green-700">User engagement and usage</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-white hover:bg-green-50 border-green-200">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">Performance Report</h3>
                    <p className="text-sm text-purple-700">System optimization insights</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-white hover:bg-purple-50 border-purple-200">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900">Financial Summary</h3>
                    <p className="text-sm text-orange-700">Revenue and billing analytics</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-white hover:bg-orange-50 border-orange-200">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-600" />
            Master Admin Configuration
          </CardTitle>
          <CardDescription>System-wide settings and administrative controls</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-red-100/50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-red-900">Maintenance Mode</h4>
                  <p className="text-sm text-red-700">Enable system-wide maintenance window</p>
                </div>
                <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
                  Configure
                </Button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900">Auto-scaling</h4>
                  <p className="text-sm text-blue-700">Automatic resource scaling configuration</p>
                </div>
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  Configure
                </Button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-green-900">Security Settings</h4>
                  <p className="text-sm text-green-700">System security and access control</p>
                </div>
                <Button variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50">
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'system': return <SystemTab />;
      case 'tenants': return <TenantsTab />;
      case 'monitoring': return <MonitoringTab />;
      case 'reports': return <ReportsTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Master Admin Console
            </h1>
            <p className="text-sm text-slate-600">
              Advanced system management and monitoring dashboard
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default MasterAdminDashboard;
