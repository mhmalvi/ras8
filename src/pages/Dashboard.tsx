
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RealDashboardStats from "@/components/RealDashboardStats";
import RealReturnsTable from "@/components/RealReturnsTable";
import AIInsightsCard from "@/components/AIInsightsCard";
import AppLayout from "@/components/AppLayout";
import { useMerchantSession } from "@/contexts/MerchantSessionContext";
import { useAppBridge } from "@/components/AppBridgeProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Dashboard: React.FC = () => {
  const { session, isAuthenticated, loading, error } = useMerchantSession();
  const { isEmbedded } = useAppBridge();
  
  // Get shop parameter for embedded apps
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');

  useEffect(() => {
    console.log('🏠 Dashboard mounted:', { 
      session: !!session,
      isAuthenticated,
      loading,
      error,
      isEmbedded,
      shop,
      host,
      merchantId: session?.merchantId,
      shopDomain: session?.shopDomain,
      currentPath: window.location.pathname
    });
  }, [session, isAuthenticated, loading, error, isEmbedded, shop, host]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Check merchant session authentication
  if (!isAuthenticated && !(isEmbedded && shop)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please complete the installation process.</p>
          {error && (
            <p className="text-red-500 text-sm mt-2">Error: {error}</p>
          )}
        </div>
      </div>
    );
  }

  // For embedded apps with merchant session, show Shopify-specific dashboard
  if (isEmbedded && shop && session) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Welcome to H5
            </h1>
            <p className="text-muted-foreground mt-2">
              Connected to {shop}
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your H5 app is successfully installed and running in Shopify Admin. 
              The app will automatically sync your store data in the background.
            </AlertDescription>
          </Alert>

          {/* Embedded App Dashboard Content */}
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>H5 Returns Management</CardTitle>
                <CardDescription>
                  Advanced returns automation for your Shopify store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">Returns Processed</div>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-primary">Ready</div>
                    <div className="text-sm text-muted-foreground">System Status</div>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-primary">Active</div>
                    <div className="text-sm text-muted-foreground">H5 Integration</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Set up your H5 returns automation system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                  <span>H5 app installed successfully</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                  <span>Connected to {shop}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">→</div>
                  <span>Ready to process returns and automate workflows</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  // If no merchant session, redirect to auth
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Setting up your account...</h2>
          <p className="text-muted-foreground">Please wait while we initialize your session.</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back to your returns automation platform
          </p>
        </div>
        
        <RealDashboardStats />
        
        <AIInsightsCard />
        
        <div>
          <h2 className="text-lg font-medium text-foreground mb-4">Recent Returns</h2>
          <div className="bg-background rounded-lg border">
            <RealReturnsTable 
              searchTerm=""
              statusFilter="all"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
