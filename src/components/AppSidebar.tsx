
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

// Merchant-only navigation items - limited feature set
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

  // Block master admin users from using merchant sidebar
  const isMasterAdmin = user?.email === 'aalvi.hm@gmail.com' || 
                        profile?.role === 'master_admin' ||
                        user?.email?.endsWith('@admin.returnsauto.com');

  // If master admin, redirect to master admin dashboard
  if (isMasterAdmin && currentPath !== '/master-admin') {
    window.location.href = '/master-admin';
    return null;
  }

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
              <p className="text-xs text-slate-500">Merchant Platform</p>
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
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-4">
        {!collapsed && (
          <div className="text-xs text-slate-500 text-center space-y-1">
            <p>© 2024 Returns Automation</p>
            <p>v1.2.0 Merchant</p>
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <Package className="h-3 w-3" />
              <span className="font-medium">Merchant Access</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
