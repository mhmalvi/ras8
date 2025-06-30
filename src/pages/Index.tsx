
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Settings, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardStats from "@/components/DashboardStats";
import MetricsChart from "@/components/MetricsChart";
import NotificationCenter from "@/components/NotificationCenter";

const Index = () => {
  // Recent activities data
  const recentActivities = [
    {
      id: 1,
      type: 'return_approved',
      message: 'Return #RET-1234 approved by AI',
      time: '2 minutes ago',
      status: 'success',
      icon: CheckCircle
    },
    {
      id: 2,
      type: 'exchange_processed',
      message: 'Exchange completed for Order #12345',
      time: '15 minutes ago',
      status: 'success',
      icon: TrendingUp
    },
    {
      id: 3,
      type: 'return_pending',
      message: 'New return request from customer@email.com',
      time: '1 hour ago',
      status: 'pending',
      icon: Clock
    },
    {
      id: 4,
      type: 'ai_suggestion',
      message: 'AI suggested alternative product for return',
      time: '2 hours ago',
      status: 'info',
      icon: AlertCircle
    }
  ];

  // Quick actions data
  const quickActions = [
    { title: 'Process Returns', description: 'Review pending returns', link: '/returns', count: 12 },
    { title: 'View Analytics', description: 'Check performance metrics', link: '/analytics', count: null },
    { title: 'AI Insights', description: 'Review AI recommendations', link: '/ai-insights', count: 8 },
    { title: 'Bulk Actions', description: 'Process multiple returns', link: '/returns', count: 5 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                  <p className="text-sm text-slate-500">Welcome back, John's Store</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <Bell className="h-4 w-4" />
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <NotificationCenter />
                  </PopoverContent>
                </Popover>
                <Link to="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Pro Plan
                </Badge>
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-slate-600 text-sm font-medium">JS</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="px-6 py-8 bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Key Performance Indicators */}
              <DashboardStats />

              {/* Charts and Analytics */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MetricsChart />
                </div>
                
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickActions.map((action, index) => (
                      <Link key={index} to={action.link}>
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{action.title}</div>
                            <div className="text-xs text-slate-500">{action.description}</div>
                          </div>
                          {action.count && (
                            <Badge variant="secondary" className="ml-2">
                              {action.count}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity and AI Insights */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>Latest updates and actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50">
                            <Icon className={`h-5 w-5 mt-0.5 ${getStatusColor(activity.status)}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                              <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Link to="/notifications">
                        <Button variant="outline" size="sm" className="w-full">
                          View All Activities
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Performance Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Performance</CardTitle>
                    <CardDescription>Smart automation insights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                        <div>
                          <div className="font-medium text-sm text-blue-900">Suggestions Accepted</div>
                          <div className="text-xs text-blue-700">This week</div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">84%</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                        <div>
                          <div className="font-medium text-sm text-green-900">Revenue Saved</div>
                          <div className="text-xs text-green-700">Through exchanges</div>
                        </div>
                        <div className="text-2xl font-bold text-green-900">$12.4K</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                        <div>
                          <div className="font-medium text-sm text-purple-900">Processing Time</div>
                          <div className="text-xs text-purple-700">Average reduction</div>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">-65%</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Link to="/ai-insights">
                        <Button variant="outline" size="sm" className="w-full">
                          View AI Insights
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Status</CardTitle>
                  <CardDescription>Platform health and integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Shopify</div>
                        <div className="text-xs text-slate-500">Connected</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">AI Engine</div>
                        <div className="text-xs text-slate-500">Active</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Automations</div>
                        <div className="text-xs text-slate-500">Running</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">Notifications</div>
                        <div className="text-xs text-slate-500">3 pending</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
