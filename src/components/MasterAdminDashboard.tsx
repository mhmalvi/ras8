
import React, { useState } from 'react';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import UserMenu from '@/components/UserMenu';
import { useMasterAdminData } from '@/hooks/useMasterAdminData';
import {
  Crown,
  Activity,
  Database,
  Users,
  DollarSign,
  TrendingUp,
  Shield,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

const MasterAdminDashboard = () => {
  const { user } = useAtomicAuth();
  const { stats, systemHealth, loading, refreshData } = useMasterAdminData();
  const [lastUpdated] = useState(new Date().toLocaleTimeString());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatsData = () => {
    if (!stats) return [];
    
    return [
      {
        title: 'Total Merchants',
        value: stats.totalMerchants.toString(),
        change: stats.monthlyGrowth.merchants > 0 ? `+${stats.monthlyGrowth.merchants}` : '0',
        subtitle: `${stats.activeMerchants} active`,
        color: 'blue',
        icon: Users,
      },
      {
        title: 'Total Returns',
        value: stats.totalReturns.toString(),
        change: stats.monthlyGrowth.returns > 0 ? `+${stats.monthlyGrowth.returns}` : '0',
        subtitle: 'this month',
        color: 'green',
        icon: TrendingUp,
      },
      {
        title: 'Revenue Impact',
        value: formatCurrency(stats.totalRevenue),
        change: stats.monthlyGrowth.revenue > 0 ? `+${formatCurrency(stats.monthlyGrowth.revenue)}` : '$0',
        subtitle: 'MTD',
        color: 'purple',
        icon: DollarSign,
      },
      {
        title: 'System Health',
        value: '99.9%',
        status: 'Operational',
        subtitle: 'Healthy',
        color: 'orange',
        icon: Activity,
      },
    ];
  };

  const getSystemServices = () => {
    if (!systemHealth) return [];
    
    return [
      {
        name: 'Database',
        status: systemHealth.database.status,
        metric: 'Response Time',
        value: systemHealth.database.responseTime,
        icon: Database,
      },
      {
        name: 'API Services',
        status: systemHealth.apiServices.status,
        metric: 'Avg Response',
        value: systemHealth.apiServices.responseTime,
        icon: Shield,
      },
      {
        name: 'AI Services',
        status: systemHealth.aiServices.status,
        metric: 'Response Time',
        value: systemHealth.aiServices.responseTime,
        icon: Crown,
      },
    ];
  };

  const statsData = getStatsData();
  const systemServices = getSystemServices();

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Master Admin Console</h1>
              <p className="text-purple-100">Welcome back, {user?.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>System Status: Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Last Updated: {lastUpdated}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white/10 hover:bg-white/20 border-white/20"
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="w-12 h-12 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            statsData.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <div className="flex items-center gap-2">
                        {stat.change && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                            {stat.change}
                          </Badge>
                        )}
                        {stat.status && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                            {stat.status}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{stat.subtitle}</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      stat.color === 'green' ? 'bg-green-100 text-green-600' :
                      stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* System Status Overview */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">System Status Overview</h3>
                <p className="text-sm text-muted-foreground">Real-time monitoring of all system components</p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {systemServices.map((service, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        index === 0 ? 'bg-green-100 text-green-600' :
                        index === 1 ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <service.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{service.name}</h4>
                          <div className={`w-2 h-2 rounded-full ${
                            service.status === 'healthy' ? 'bg-green-500' : 
                            service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-xs font-medium ${
                            service.status === 'healthy' ? 'text-green-600' : 
                            service.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                          }`}>{service.status}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{service.metric}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{service.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          index === 0 ? 'bg-green-500' :
                          index === 1 ? 'bg-blue-500' :
                          'bg-purple-500'
                        }`} style={{ width: service.status === 'healthy' ? '85%' : '60%' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MasterAdminDashboard;
