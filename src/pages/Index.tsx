
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UserMenu from "@/components/UserMenu";
import { useProfile } from "@/hooks/useProfile";
import ProfileCreator from "@/components/ProfileCreator";
import MerchantAssignment from "@/components/MerchantAssignment";
import RealDashboardStats from "@/components/RealDashboardStats";
import RealReturnsTable from "@/components/RealReturnsTable";
import NotificationCenter from "@/components/NotificationCenter";
import AIInsightsCard from "@/components/AIInsightsCard";

const Index = () => {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Merchant Dashboard</h1>
                <p className="text-slate-500">Welcome back to your returns automation platform</p>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationCenter />
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {!profile ? (
              <div className="max-w-2xl mx-auto">
                <ProfileCreator />
              </div>
            ) : !profile.merchant_id ? (
              <div className="max-w-2xl mx-auto">
                <MerchantAssignment />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Dashboard Stats */}
                <RealDashboardStats />
                
                <Separator />
                
                {/* AI Insights */}
                <AIInsightsCard />
                
                <Separator />
                
                {/* Recent Returns */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Returns</CardTitle>
                    <CardDescription>
                      Latest return requests from your customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RealReturnsTable limit={10} />
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
