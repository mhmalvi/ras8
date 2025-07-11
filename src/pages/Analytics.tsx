
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AppLayout from "@/components/AppLayout";

const Analytics = () => {
  return (
    <AppLayout 
      title="Analytics" 
      description="Track your returns performance and AI insights"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Returns Analytics</CardTitle>
            <CardDescription>
              Comprehensive insights into your returns performance and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsDashboard />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Analytics;
