
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardStats from "@/components/DashboardStats";
import MetricsChart from "@/components/MetricsChart";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
                  <p className="text-sm text-slate-500">Welcome back, {user?.email}</p>
                </div>
              </div>
              <UserMenu />
            </div>
          </header>

          <main className="px-6 py-8 bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-8">
              <DashboardStats />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <MetricsChart />
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">New return request</span>
                      <span className="text-xs text-slate-400">2 min ago</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">AI suggestion accepted</span>
                      <span className="text-xs text-slate-400">15 min ago</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Return processed</span>
                      <span className="text-xs text-slate-400">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
