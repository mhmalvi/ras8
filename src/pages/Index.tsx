
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RealDashboardStats from "@/components/RealDashboardStats";
import RealReturnsTable from "@/components/RealReturnsTable";
import AIInsightsCard from "@/components/AIInsightsCard";
import AppLayout from "@/components/AppLayout";

const Index = () => {
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
