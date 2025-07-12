
import React, { useState, useEffect } from 'react';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { MasterAdminService } from '@/services/masterAdminService';
import type { SystemMetrics } from '@/types/MasterAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  BarChart3,
  Settings,
  Bell,
  Crown,
  Search,
  Filter,
  Download,
  Ban,
  UnlockKeyhole,
  Eye,
  Trash2,
  MoreHorizontal,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const MasterAdminSidebar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'system', label: 'System Health', icon: Activity },
    { id: 'tenants', label: 'Merchants', icon: Store },
    { id: 'monitoring', label: 'Monitoring', icon: Eye },
    { id: 'reports', label: 'Reports', icon: Download },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Sidebar className="w-64 border-r border-border/40 bg-gradient-to-b from-background to-background/95">
      <SidebarContent>
        <div className="p-6 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Master Admin
              </h2>
              <p className="text-xs text-muted-foreground">System Control</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    className={`w-full justify-start gap-3 px-4 py-3 transition-all duration-200 ${
                      activeTab === item.id 
                        ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-r-2 border-purple-500 text-purple-700 dark:text-purple-300' 
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <button onClick={() => setActiveTab(item.id)}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const MasterAdminDashboard = () => {
  const { user } = useAtomicAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MasterAdminService.getSystemMetrics();
      setMetrics(data);
      console.log('📊 Loaded real system metrics:', data);
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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          <p className="text-slate-600">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load system metrics: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!metrics) return null;

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Merchants</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{metrics.total_merchants}</div>
            <p className="text-xs text-blue-600">
              {metrics.active_merchants} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Returns</CardTitle>
            <RefreshCw className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{metrics.total_returns}</div>
            <p className="text-xs text-green-600">
              {metrics.returns_this_month} this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              ${metrics.total_revenue.toFixed(2)}
            </div>
            <p className="text-xs text-purple-600">
              ${metrics.revenue_this_month.toFixed(2)} this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">System Health</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {metrics.system_health.uptime_percentage}%
            </div>
            <p className="text-xs text-orange-600">Uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div>
                <p className="font-medium text-green-900">Database</p>
                <p className="text-sm text-green-700">{metrics.system_health.database_status}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div>
                <p className="font-medium text-green-900">API Services</p>
                <p className="text-sm text-green-700">{metrics.system_health.api_status}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div>
                <p className="font-medium text-green-900">AI Services</p>
                <p className="text-sm text-green-700">{metrics.system_health.ai_service_status}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TenantsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Merchant Management</h3>
          <p className="text-sm text-muted-foreground">Manage and monitor merchant accounts</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merchant Overview</CardTitle>
          <CardDescription>
            {metrics.tenant_metrics.length} total merchants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {metrics.tenant_metrics.map((tenant) => (
                <div key={tenant.merchant_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{tenant.shop_domain}</h4>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                      <Badge variant="outline">{tenant.plan_type}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{tenant.returns_count} returns</span>
                      <span>${tenant.revenue_impact.toFixed(2)} revenue</span>
                      <span>Last active: {new Date(tenant.last_activity).toLocaleDateString()}</span>
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
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const SystemTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Database Performance</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>API Response Time</span>
                <span>350ms avg</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Resource Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>CPU Usage</span>
                  <span>45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Memory Usage</span>
                  <span>67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Storage</span>
                  <span>23%</span>
                </div>
                <Progress value={23} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Network I/O</span>
                  <span>34%</span>
                </div>
                <Progress value={34} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const MonitoringTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Real-time Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All systems operational - Last check: {new Date().toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm p-2 rounded hover:bg-accent/50">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                <span>System metrics refreshed</span>
              </div>
              <div className="flex items-center gap-2 text-sm p-2 rounded hover:bg-accent/50">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{new Date(Date.now() - 300000).toLocaleTimeString()}</span>
                <span>User {user?.email} accessed master admin panel</span>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const ReportsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start gap-2">
              <Download className="h-4 w-4" />
              System Metrics Report
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Download className="h-4 w-4" />
              Merchant Activity Report
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Download className="h-4 w-4" />
              Performance Report
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Download className="h-4 w-4" />
              Financial Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Maintenance Mode</h4>
                <p className="text-sm text-muted-foreground">Enable system-wide maintenance</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Auto-scaling</h4>
                <p className="text-sm text-muted-foreground">Automatic resource scaling</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Security Settings</h4>
                <p className="text-sm text-muted-foreground">System security configuration</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/20">
        <MasterAdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-6 gap-4">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Master Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  System overview and management console
                </p>
              </div>
              <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {renderTabContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MasterAdminDashboard;
