
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RealDashboardStats from "@/components/RealDashboardStats";
import RealReturnsTable from "@/components/RealReturnsTable";
import AIInsightsCard from "@/components/AIInsightsCard";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

const Index: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
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

export default Index;
