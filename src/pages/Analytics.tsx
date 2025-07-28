
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AppLayout from "@/components/AppLayout";
import { Separator } from "@/components/ui/separator";
import { TrendingUp } from "lucide-react";

const Analytics = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Track your returns performance and AI insights
            </p>
            <Separator className="mt-4" />
          </div>
          
          {/* Analytics Dashboard */}
          <section className="animate-fade-in">
            <AnalyticsDashboard />
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
