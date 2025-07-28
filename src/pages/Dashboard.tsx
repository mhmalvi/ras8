
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RealDashboardStats from "@/components/RealDashboardStats";
import RealReturnsTable from "@/components/RealReturnsTable";
import AIInsightsCard from "@/components/AIInsightsCard";
import AppLayout from "@/components/AppLayout";
import { useAtomicAuth } from "@/contexts/AtomicAuthContext";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import MerchantAssignment from "@/components/MerchantAssignment";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, loading } = useAtomicAuth();
  const { profile, loading: profileLoading, error: profileError } = useMerchantProfile();

  useEffect(() => {
    console.log('🏠 Dashboard mounted:', { 
      user: !!user, 
      profile, 
      loading, 
      profileLoading, 
      profileError,
      currentPath: window.location.pathname
    });
  }, [user, profile, loading, profileLoading, profileError]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // If user doesn't have a merchant assigned, show setup screen
  if (!profile?.merchant_id) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Welcome! To get started, assign yourself to an existing merchant to explore the platform.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 gap-6">
            <MerchantAssignment />
          </div>
        </div>
      </AppLayout>
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
