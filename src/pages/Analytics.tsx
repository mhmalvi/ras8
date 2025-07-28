
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AppLayout from "@/components/AppLayout";

const Analytics = () => {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your returns performance and AI insights
          </p>
        </div>
        
        <AnalyticsDashboard />
      </div>
    </AppLayout>
  );
};

export default Analytics;
