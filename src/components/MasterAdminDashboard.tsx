import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Zap,
  Crown,
  BarChart3,
  MessageSquare,
  Bell,
  Webhook,
  CreditCard,
  FileText,
  Download,
  Upload,
  MonitorSpeaker,
  Cpu,
  HardDrive,
  Network,
  Timer,
  Target,
  TrendingDown,
  Sparkles,
  Flame,
  Lightning,
  Layers,
  Command,
  Boxes,
  Radio,
  Waves,
  CircuitBoard,
  Gauge
} from 'lucide-react';
import { MasterAdminService } from '@/services/masterAdminService';
import type { SystemMetrics, TenantMetric } from '@/types/MasterAdmin';

const MasterAdminDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadSystemMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadSystemMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemMetrics = async () => {
    try {
      setLoading(metrics === null);
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
      case 'healthy': return 'text-emerald-600 bg-emerald-100/80 border-emerald-200';
      case 'warning': return 'text-amber-600 bg-amber-100/80 border-amber-200';
      case 'critical': return 'text-red-600 bg-red-100/80 border-red-200';
      default: return 'text-gray-500 bg-gray-100/80 border-gray-200';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-blue-400/50 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 w-16 h-16 border-2 border-transparent border-r-pink-400/40 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold text-white">Initializing Master Control</h3>
            <p className="text-purple-300">Connecting to the matrix...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
        <div className="max-w-md w-full">
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">System Error</h3>
              <p className="text-red-300">{error}</p>
            </div>
            <Button 
              onClick={loadSystemMetrics} 
              className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reconnect to System
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 space-y-8 p-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Crown className="h-10 w-10 text-yellow-400 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  MASTER CONTROL
                </h1>
                <p className="text-purple-300 text-lg font-medium">System Command Center • Real-time Operations</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 backdrop-blur-xl bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-300 font-semibold">LIVE</span>
            </div>
            <Button 
              onClick={loadSystemMetrics} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
              className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* System Status Banner */}
        <div className="backdrop-blur-xl bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-emerald-400" />
              <div>
                <span className="text-emerald-300 font-bold text-lg">🟢 ALL SYSTEMS OPERATIONAL</span>
                <p className="text-emerald-400/80 text-sm">Last sync: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-emerald-300 font-bold">{metrics.system_health.uptime_percentage}%</p>
                <p className="text-emerald-400/80 text-sm">Uptime</p>
              </div>
              <div className="w-12 h-12 bg-emerald-400/20 rounded-full flex items-center justify-center">
                <Gauge className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Merchants */}
          <Card className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/30 hover:border-blue-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-bold text-blue-200 uppercase tracking-wide">Merchants</CardTitle>
              <div className="relative">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse opacity-75"></div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-white mb-2">{metrics.total_merchants.toLocaleString()}</div>
              <div className="flex items-center text-sm">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ArrowUp className="h-4 w-4" />
                  <span>{metrics.active_merchants}</span>
                </div>
                <span className="text-blue-300 ml-2">active this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Returns */}
          <Card className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/30 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-bold text-purple-200 uppercase tracking-wide">Returns</CardTitle>
              <div className="relative">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-75"></div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-white mb-2">{metrics.total_returns.toLocaleString()}</div>
              <div className="flex items-center text-sm">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ArrowUp className="h-4 w-4" />
                  <span>+{metrics.returns_this_month}</span>
                </div>
                <span className="text-purple-300 ml-2">this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-bold text-emerald-200 uppercase tracking-wide">Revenue</CardTitle>
              <div className="relative">
                <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors duration-300">
                  <DollarSign className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse opacity-75"></div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-white mb-2">
                ${metrics.total_revenue.toLocaleString()}
              </div>
              <div className="flex items-center text-sm">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ArrowUp className="h-4 w-4" />
                  <span>+${metrics.revenue_this_month.toLocaleString()}</span>
                </div>
                <span className="text-emerald-300 ml-2">this month</span>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-400/30 hover:border-orange-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-bold text-orange-200 uppercase tracking-wide">Health</CardTitle>
              <div className="relative">
                <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors duration-300">
                  <Activity className="h-6 w-6 text-orange-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse opacity-75"></div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-white mb-2">
                {metrics.system_health.uptime_percentage}%
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-emerald-400 mr-1" />
                <span className="text-emerald-400 font-bold">Operational</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 backdrop-blur-xl bg-white/10 border border-white/20 p-1 rounded-2xl shadow-2xl">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white transition-all duration-300">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white transition-all duration-300">
              <Server className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white transition-all duration-300">
              <Users className="h-4 w-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white transition-all duration-300">
              <MonitorSpeaker className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white transition-all duration-300">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white transition-all duration-300">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Enhanced System Health Dashboard */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/20 shadow-2xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Zap className="h-6 w-6 text-blue-400" />
                      </div>
                      System Status Matrix
                    </CardTitle>
                    <CardDescription className="text-lg text-blue-200 mt-2">Real-time service monitoring and diagnostics</CardDescription>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-4 py-2 text-sm font-bold">
                    All Services Online
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Database Status */}
                  <div className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${getHealthStatusColor(metrics.system_health.database_status)} border transition-all duration-300 group-hover:scale-110`}>
                        <Database className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">Database Core</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getHealthStatusIcon(metrics.system_health.database_status)}
                          <span className="text-blue-300 capitalize font-semibold">{metrics.system_health.database_status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Services Status */}
                  <div className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${getHealthStatusColor(metrics.system_health.api_status)} border transition-all duration-300 group-hover:scale-110`}>
                        <Server className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">API Gateway</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getHealthStatusIcon(metrics.system_health.api_status)}
                          <span className="text-purple-300 capitalize font-semibold">{metrics.system_health.api_status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Services Status */}
                  <div className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${getHealthStatusColor(metrics.system_health.ai_service_status)} border transition-all duration-300 group-hover:scale-110`}>
                        <Brain className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">AI Engine</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getHealthStatusIcon(metrics.system_health.ai_service_status)}
                          <span className="text-emerald-300 capitalize font-semibold">{metrics.system_health.ai_service_status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                  <div className="p-2 bg-orange-500/20 rounded-xl">
                    <Target className="h-6 w-6 text-orange-400" />
                  </div>
                  Command Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-red-500/10 border-red-400/30 text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-300 group">
                    <Bell className="h-6 w-6 group-hover:animate-pulse" />
                    <span className="font-bold">Alert System</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200 transition-all duration-300 group">
                    <Download className="h-6 w-6 group-hover:animate-bounce" />
                    <span className="font-bold">Export Data</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-purple-500/10 border-purple-400/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all duration-300 group">
                    <Settings className="h-6 w-6 group-hover:animate-spin" />
                    <span className="font-bold">Configure</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 transition-all duration-300 group">
                    <RefreshCw className="h-6 w-6 group-hover:animate-spin" />
                    <span className="font-bold">Force Sync</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* System Resources */}
              <Card className="backdrop-blur-xl bg-white/5 border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <Cpu className="h-6 w-6 text-blue-400" />
                    </div>
                    Resource Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">CPU Usage</span>
                      <span className="text-emerald-400 font-bold">23%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-3 rounded-full transition-all duration-1000 ease-out" style={{width: '23%'}}></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">Memory Usage</span>
                      <span className="text-yellow-400 font-bold">67%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-400 h-3 rounded-full transition-all duration-1000 ease-out" style={{width: '67%'}}></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">Disk Usage</span>
                      <span className="text-blue-400 font-bold">45%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-1000 ease-out" style={{width: '45%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Stats */}
              <Card className="backdrop-blur-xl bg-white/5 border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                      <Network className="h-6 w-6 text-purple-400" />
                    </div>
                    Network Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 backdrop-blur-xl bg-emerald-500/10 border border-emerald-400/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-emerald-400" />
                      <span className="text-white font-semibold">Upload</span>
                    </div>
                    <span className="text-emerald-400 font-bold">1.2 MB/s</span>
                  </div>
                  <div className="flex items-center justify-between p-4 backdrop-blur-xl bg-blue-500/10 border border-blue-400/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Download className="h-5 w-5 text-blue-400" />
                      <span className="text-white font-semibold">Download</span>
                    </div>
                    <span className="text-blue-400 font-bold">3.4 MB/s</span>
                  </div>
                  <div className="flex items-center justify-between p-4 backdrop-blur-xl bg-orange-500/10 border border-orange-400/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Timer className="h-5 w-5 text-orange-400" />
                      <span className="text-white font-semibold">Latency</span>
                    </div>
                    <span className="text-orange-400 font-bold">12ms</span>
                  </div>
                  <div className="flex items-center justify-between p-4 backdrop-blur-xl bg-purple-500/10 border border-purple-400/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Webhook className="h-5 w-5 text-purple-400" />
                      <span className="text-white font-semibold">Active Connections</span>
                    </div>
                    <span className="text-purple-400 font-bold">847</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/5 border-white/20 shadow-2xl">
              <CardHeader className="pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Globe className="h-6 w-6 text-blue-400" />
                      </div>
                      Tenant Control Panel
                    </CardTitle>
                    <CardDescription className="text-lg text-blue-200 mt-2">Manage merchant accounts and access controls</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-400/30 px-4 py-2 font-bold">
                    {metrics.tenant_metrics.length} Active Tenants
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {metrics.tenant_metrics.map((tenant, index) => (
                    <div 
                      key={tenant.merchant_id} 
                      className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-[1.02]"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-300 font-bold text-lg border border-blue-400/30">
                              {tenant.shop_domain.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-xl group-hover:text-blue-300 transition-colors">
                                {tenant.shop_domain}
                              </h4>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge 
                                  variant={tenant.status === 'active' ? 'default' : 'secondary'}
                                  className={tenant.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-gray-500/20 text-gray-300'}
                                >
                                  {tenant.status}
                                </Badge>
                                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                                  {tenant.plan_type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8 text-sm text-white/80 ml-16">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-purple-400" />
                              <span className="font-semibold text-purple-300">{tenant.returns_count}</span>
                              <span>returns</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-400" />
                              <span className="font-semibold text-emerald-300">${tenant.revenue_impact.toLocaleString()}</span>
                              <span>revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-400" />
                              <span>Last active: {new Date(tenant.last_activity).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 text-white hover:bg-white/20">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 text-white hover:bg-white/20">
                            <Settings className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                          {tenant.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleToggleMerchantStatus(tenant.merchant_id, true)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30"
                            >
                              <Ban className="mr-1 h-4 w-4" />
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleToggleMerchantStatus(tenant.merchant_id, false)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30"
                            >
                              <Play className="mr-1 h-4 w-4" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                    <Activity className="h-6 w-6 text-green-400" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">API Response Time</span>
                    <span className="text-green-400 font-bold">145ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Database Query Time</span>
                    <span className="text-blue-400 font-bold">32ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Error Rate</span>
                    <span className="text-red-400 font-bold">0.02%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Requests/min</span>
                    <span className="text-purple-400 font-bold">1,247</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="flex-1">
                      <p className="text-white font-semibold">High Memory Usage</p>
                      <p className="text-sm text-yellow-300">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-white font-semibold">Database Backup Complete</p>
                      <p className="text-sm text-blue-300">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div className="flex-1">
                      <p className="text-white font-semibold">System Update Applied</p>
                      <p className="text-sm text-green-300">1 hour ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                  <FileText className="h-6 w-6 text-blue-400" />
                  System Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200 transition-all duration-300 group">
                    <BarChart3 className="h-6 w-6" />
                    Usage Analytics
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 transition-all duration-300 group">
                    <CreditCard className="h-6 w-6" />
                    Revenue Report
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-purple-500/10 border-purple-400/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all duration-300 group">
                    <Users className="h-6 w-6" />
                    User Activity
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-red-500/10 border-red-400/30 text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-300 group">
                    <Shield className="h-6 w-6" />
                    Security Audit
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-pink-500/10 border-pink-400/30 text-pink-300 hover:bg-pink-500/20 hover:text-pink-200 transition-all duration-300 group">
                    <TrendingDown className="h-6 w-6" />
                    Error Logs
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-3 backdrop-blur-xl bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200 transition-all duration-300 group">
                    <Download className="h-6 w-6" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                    <Settings className="h-6 w-6 text-blue-400" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Maintenance Mode</span>
                    <Button variant="outline" size="sm">Disabled</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">API Rate Limiting</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Backup Settings</span>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Email Notifications</span>
                    <Button variant="outline" size="sm">Settings</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                    <Shield className="h-6 w-6 text-red-600" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Two-Factor Auth</span>
                    <Button variant="outline" size="sm">Enabled</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Session Timeout</span>
                    <Button variant="outline" size="sm">30 mins</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">IP Whitelist</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Audit Logging</span>
                    <Button variant="outline" size="sm">Enabled</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MasterAdminDashboard;
