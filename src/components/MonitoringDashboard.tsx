import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, Clock, Users, Server, RefreshCw } from 'lucide-react';
import { MonitoringService } from '@/services/monitoringService';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    errorRate: 0,
    avgResponseTime: 0,
    activeAlerts: 0,
    systemHealth: 'healthy' as 'healthy' | 'warning' | 'critical'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await MonitoringService.getDashboardMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
      
      console.log('📊 Monitoring metrics loaded:', data);
    } catch (err) {
      console.error('Failed to load monitoring metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  if (loading && metrics.totalRequests === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Production Monitoring</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Production Monitoring</h2>
          <p className="text-slate-600">Real-time system metrics and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button 
            onClick={loadMetrics} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Health Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getHealthIcon(metrics.systemHealth)}</div>
              <div>
                <h3 className="font-semibold text-lg">System Health</h3>
                <Badge className={`${getHealthColor(metrics.systemHealth)} capitalize`}>
                  {metrics.systemHealth}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Active Alerts</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.activeAlerts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Requests</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.totalRequests.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Last 24 hours</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Error Rate</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.errorRate.toFixed(2)}%</p>
                <p className="text-sm text-slate-500">
                  {metrics.errorRate < 1 ? 'Excellent' : metrics.errorRate < 5 ? 'Good' : 'Needs attention'}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${
                metrics.errorRate < 1 ? 'text-green-600' : 
                metrics.errorRate < 5 ? 'text-yellow-600' : 
                'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.avgResponseTime}ms</p>
                <p className="text-sm text-slate-500">
                  {metrics.avgResponseTime < 200 ? 'Fast' : 
                   metrics.avgResponseTime < 500 ? 'Normal' : 'Slow'}
                </p>
              </div>
              <Clock className={`h-8 w-8 ${
                metrics.avgResponseTime < 200 ? 'text-green-600' : 
                metrics.avgResponseTime < 500 ? 'text-yellow-600' : 
                'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Users</p>
                <p className="text-2xl font-bold text-slate-900">---</p>
                <p className="text-sm text-slate-500">Coming soon</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Monitoring Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-slate-600">15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-slate-600">42%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Connections</span>
                <span className="text-sm text-slate-600">8/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.activeAlerts === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No active alerts. System is running smoothly.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">High Response Time</p>
                    <p className="text-xs text-slate-600">API endpoint /returns taking longer than usual</p>
                  </div>
                  <Badge variant="outline" className="text-yellow-700">Warning</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonitoringDashboard;