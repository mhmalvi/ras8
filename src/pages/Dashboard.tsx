
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RealDashboardStats from "@/components/RealDashboardStats";
import RealReturnsTable from "@/components/RealReturnsTable";
import AIInsightsCard from "@/components/AIInsightsCard";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import MerchantAssignment from "@/components/MerchantAssignment";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfile();

  console.log('🏠 Dashboard render:', { user: !!user, profile, loading, profileLoading, profileError });

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // If user doesn't have a merchant assigned, show setup screen
  if (!profile?.merchant_id) {
    return (
      <AppLayout 
        title="Welcome to Returns Automation" 
        description="Let's get your account set up"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Welcome! To get started, you can either assign yourself to an existing merchant or create sample data to explore the platform.
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
    <AppLayout 
      title="Merchant Dashboard" 
      description="Welcome back to your returns automation platform"
    >
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
            <RealReturnsTable 
              searchTerm=""
              statusFilter="all"
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
