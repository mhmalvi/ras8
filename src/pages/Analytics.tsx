
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AppLayout from "@/components/AppLayout";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TrendingUp, RefreshCw } from "lucide-react";

const Analytics = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Analytics
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Track your returns performance and AI insights
                </p>
              </div>
              <Button 
                variant="outline"
                className="transition-all duration-200 hover:shadow-lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
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
