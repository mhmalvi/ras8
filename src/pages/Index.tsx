
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import RealDashboardStats from "@/components/RealDashboardStats";
import MetricsChart from "@/components/MetricsChart";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

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
                  <p className="text-sm text-slate-500">
                    Welcome back, {profile?.first_name || user?.email || 'User'}
                  </p>
                </div>
              </div>
              <UserMenu />
            </div>
          </header>

          <main className="px-6 py-8 bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Merchant Setup Alert */}
              {!loading && (!profile?.merchant_id) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You haven't been assigned to a merchant yet. Contact support to get set up with a merchant account.
                  </AlertDescription>
                </Alert>
              )}
              
              <RealDashboardStats />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <MetricsChart />
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Getting Started</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Connect your Shopify store</span>
                      <Button variant="outline" size="sm">Setup</Button>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Configure AI recommendations</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Set up return policies</span>
                      <Button variant="outline" size="sm">Setup</Button>
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
