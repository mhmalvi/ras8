
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
  Play
} from 'lucide-react';
import { MasterAdminService } from '@/services/masterAdminService';
import type { SystemMetrics, TenantMetric } from '@/types/MasterAdmin';

const MasterAdminDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantMetric | null>(null);

  useEffect(() => {
    loadSystemMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadSystemMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemMetrics = async () => {
    try {
      setLoading(true);
      const data = await MasterAdminService.getSystemMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load system metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMerchantStatus = async (merchantId: string, suspend: boolean) => {
    try {
      await MasterAdminService.toggleMerchantStatus(merchantId, suspend);
      await loadSystemMetrics(); // Refresh data
    } catch (err) {
      console.error('Failed to toggle merchant status:', err);
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading system metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load master admin dashboard: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Master Admin Dashboard</h1>
          <p className="text-slate-600">System-wide management and monitoring</p>
        </div>
        <Button onClick={loadSystemMetrics} variant="outline">
          <Activity className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* System Health Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          System Status: All services operational. Last updated: {new Date().toLocaleTimeString()}
        </AlertDescription>
      </Alert>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_merchants}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.active_merchants} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_returns}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.returns_this_month} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.total_revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +${metrics.revenue_this_month.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.system_health.uptime_percentage}%
            </div>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Details */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Status</CardTitle>
          <CardDescription>Real-time service monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              {getHealthStatusIcon(metrics.system_health.database_status)}
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {metrics.system_health.database_status}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getHealthStatusIcon(metrics.system_health.api_status)}
              <div>
                <p className="font-medium">API Services</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {metrics.system_health.api_status}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getHealthStatusIcon(metrics.system_health.ai_service_status)}
              <div>
                <p className="font-medium">AI Services</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {metrics.system_health.ai_service_status}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Management */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Management</CardTitle>
          <CardDescription>Manage merchant accounts and access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.tenant_metrics.map((tenant) => (
              <div key={tenant.merchant_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium">{tenant.shop_domain}</h4>
                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                      {tenant.status}
                    </Badge>
                    <Badge variant="outline">{tenant.plan_type}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {tenant.returns_count} returns • ${tenant.revenue_impact.toLocaleString()} revenue
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {tenant.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleToggleMerchantStatus(tenant.merchant_id, true)}
                    >
                      <Ban className="mr-1 h-3 w-3" />
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleToggleMerchantStatus(tenant.merchant_id, false)}
                    >
                      <Play className="mr-1 h-3 w-3" />
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
  );
};

export default MasterAdminDashboard;
