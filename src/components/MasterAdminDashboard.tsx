
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  Play,
  RefreshCw,
  Database,
  Server,
  Brain,
  Globe,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings,
  Zap
} from 'lucide-react';
import { MasterAdminService } from '@/services/masterAdminService';
import type { SystemMetrics, TenantMetric } from '@/types/MasterAdmin';

const MasterAdminDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSystemMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadSystemMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemMetrics = async () => {
    try {
      setLoading(metrics === null); // Only show loading on initial load
      setRefreshing(metrics !== null);
      const data = await MasterAdminService.getSystemMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load system metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleMerchantStatus = async (merchantId: string, suspend: boolean) => {
    try {
      await MasterAdminService.toggleMerchantStatus(merchantId, suspend);
      await loadSystemMetrics();
    } catch (err) {
      console.error('Failed to toggle merchant status:', err);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-b-primary/40 animate-pulse"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-slate-900">Loading Master Admin Dashboard</h3>
            <p className="text-slate-600 mt-1">Fetching system metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-2">Dashboard Error</div>
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={loadSystemMetrics} 
            className="w-full mt-4"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="space-y-8 p-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Master Admin Dashboard
            </h1>
            <p className="text-slate-600 text-lg">System-wide management and real-time monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live Data
            </Badge>
            <Button 
              onClick={loadSystemMetrics} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
              className="hover:bg-blue-50 border-blue-200"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* System Status Banner */}
        <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <Shield className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">
            <div className="flex items-center justify-between">
              <span>🟢 All systems operational • Last updated: {new Date().toLocaleTimeString()}</span>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                {metrics.system_health.uptime_percentage}% Uptime
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Enhanced Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Merchants */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50/50 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Merchants</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.total_merchants.toLocaleString()}</div>
              <div className="flex items-center text-sm">
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">{metrics.active_merchants}</span>
                <span className="text-slate-500 ml-1">active this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Returns */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-purple-50/50 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Returns</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.total_returns.toLocaleString()}</div>
              <div className="flex items-center text-sm">
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+{metrics.returns_this_month}</span>
                <span className="text-slate-500 ml-1">this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50/50 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                ${metrics.total_revenue.toLocaleString()}
              </div>
              <div className="flex items-center text-sm">
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+${metrics.revenue_this_month.toLocaleString()}</span>
                <span className="text-slate-500 ml-1">this month</span>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-orange-50/50 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">System Health</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {metrics.system_health.uptime_percentage}%
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">Operational</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced System Health Dashboard */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  System Health Status
                </CardTitle>
                <CardDescription className="text-base">Real-time service monitoring and status</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                All Services Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Database Status */}
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${getHealthStatusColor(metrics.system_health.database_status)}`}>
                  <Database className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Database</p>
                  <p className="text-sm text-slate-600 capitalize flex items-center gap-2">
                    {getHealthStatusIcon(metrics.system_health.database_status)}
                    {metrics.system_health.database_status}
                  </p>
                </div>
              </div>

              {/* API Services Status */}
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${getHealthStatusColor(metrics.system_health.api_status)}`}>
                  <Server className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">API Services</p>
                  <p className="text-sm text-slate-600 capitalize flex items-center gap-2">
                    {getHealthStatusIcon(metrics.system_health.api_status)}
                    {metrics.system_health.api_status}
                  </p>
                </div>
              </div>

              {/* AI Services Status */}
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${getHealthStatusColor(metrics.system_health.ai_service_status)}`}>
                  <Brain className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">AI Services</p>
                  <p className="text-sm text-slate-600 capitalize flex items-center gap-2">
                    {getHealthStatusIcon(metrics.system_health.ai_service_status)}
                    {metrics.system_health.ai_service_status}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tenant Management */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Tenant Management
                </CardTitle>
                <CardDescription className="text-base">Manage merchant accounts and access controls</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  {metrics.tenant_metrics.length} Active Tenants
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.tenant_metrics.map((tenant, index) => (
                <div 
                  key={tenant.merchant_id} 
                  className="group flex items-center justify-between p-6 border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50/50 hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 font-semibold">
                        {tenant.shop_domain.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">
                          {tenant.shop_domain}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge 
                            variant={tenant.status === 'active' ? 'default' : 'secondary'}
                            className={tenant.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-800'}
                          >
                            {tenant.status}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            {tenant.plan_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-slate-600 ml-14">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">{tenant.returns_count}</span> returns
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">${tenant.revenue_impact.toLocaleString()}</span> revenue
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Last active: {new Date(tenant.last_activity).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    {tenant.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleToggleMerchantStatus(tenant.merchant_id, true)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Ban className="mr-1 h-4 w-4" />
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleToggleMerchantStatus(tenant.merchant_id, false)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-green-600 hover:bg-green-700"
                      >
                        <Play className="mr-1 h-4 w-4" />
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MasterAdminDashboard;
