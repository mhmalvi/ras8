
import { Home, Package, BarChart, Activity, Webhook, TrendingUp, Users, Inbox } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { SubscriptionInfo } from "@/components/SubscriptionInfo"
import { useAppBridge } from "@/components/AppBridgeProvider"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const mainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Returns",
    url: "/returns",
    icon: Package,
  },
  {
    title: "Analytics",
    url: "/analytics", 
    icon: BarChart,
  },
  {
    title: "AI Insights",
    url: "/ai-insights",
    icon: TrendingUp,
  },
  {
    title: "Products",
    url: "/products",
    icon: Inbox,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Automations",
    url: "/automations",
    icon: Activity,
  },
  {
    title: "Integrations",
    url: "/integrations",
    icon: Webhook,
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { isEmbedded } = useAppBridge()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarContent className="gap-4">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "transition-opacity duration-200",
            isCollapsed ? "opacity-0 invisible" : "opacity-100"
          )}>
            H5
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={isCollapsed ? item.title : undefined}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary cursor-pointer w-full",
                        isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50 text-muted-foreground",
                        isCollapsed ? "justify-center px-2" : ""
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isCollapsed ? "h-5 w-5" : ""
                      )} />
                      {!isCollapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Usage Panel at Bottom */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            {/* Subscription Usage Info - only show when expanded */}
            {!isCollapsed && (
              <SubscriptionInfo isCollapsed={isCollapsed} />
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
