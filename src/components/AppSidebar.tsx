
import { useState } from "react";
import { 
  BarChart3, 
  Home, 
  RefreshCw, 
  Settings, 
  Users, 
  Bell,
  Package,
  TrendingUp,
  Brain,
  Zap,
  Shield,
  Bug,
  Crown,
  Database,
  UserCog,
  Activity,
  FileText,
  MessageSquare,
  CreditCard,
  Globe,
  Webhook
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAtomicAuth } from "@/contexts/AtomicAuthContext";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Returns", url: "/returns", icon: RefreshCw },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "AI Insights", url: "/ai-insights", icon: Brain },
];

const managementItems = [
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Products", url: "/products", icon: Package },
  { title: "Performance", url: "/performance", icon: TrendingUp },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

const systemItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Automations", url: "/automations", icon: Zap },
  { title: "Security", url: "/security", icon: Shield },
  { title: "Integrations", url: "/integrations", icon: Globe },
  { title: "Webhooks", url: "/webhooks", icon: Webhook },
];

const devItems = [
  { title: "Debug Panel", url: "/debug", icon: Bug },
  { title: "Database", url: "/database", icon: Database },
  { title: "Logs", url: "/logs", icon: FileText },
  { title: "API Monitor", url: "/api-monitor", icon: Activity },
];

const adminItems = [
  { title: "Master Admin", url: "/master-admin", icon: Crown },
  { title: "User Management", url: "/user-management", icon: UserCog },
  { title: "System Reports", url: "/system-reports", icon: FileText },
  { title: "Support Center", url: "/support", icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAtomicAuth();
  const { profile } = useMerchantProfile();

  const isActive = (path: string) => currentPath === path;
  const getNavClass = (path: string) => 
    isActive(path) 
      ? "bg-blue-100 text-blue-700 font-medium" 
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  // Check if user has admin access
  const isMasterAdmin = user?.email?.includes('admin') || 
                        profile?.role === 'master_admin' ||
                        user?.email === 'aalvi.hm@gmail.com';

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="border-b border-slate-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-slate-900">Returns Auto</h2>
              <p className="text-xs text-slate-500">AI-Powered Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Development</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {devItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isMasterAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex items-center gap-2">
                <Crown className="h-3 w-3 text-yellow-600" />
                {!collapsed && <span className="text-yellow-700 font-semibold">Admin</span>}
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`${getNavClass(item.url)} ${isActive(item.url) ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-yellow-50'}`}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-4">
        {!collapsed && (
          <div className="text-xs text-slate-500 text-center space-y-1">
            <p>© 2024 Returns Automation</p>
            <p>v1.2.0 Enterprise</p>
            {isMasterAdmin && (
              <div className="flex items-center justify-center gap-1 text-yellow-600">
                <Crown className="h-3 w-3" />
                <span className="font-medium">Admin Access</span>
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
