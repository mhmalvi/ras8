
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/LoadingStates";

const Performance = () => {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor system performance and optimization metrics
          </p>
        </div>
        
        <div className="bg-background rounded-lg border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">Performance Monitoring</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track system performance, response times, and optimization opportunities
            </p>
          </div>
          
          <div className="text-center py-12">
            <LoadingSpinner text="Performance data loading..." />
            <p className="text-muted-foreground mt-4">
              Performance monitoring dashboard is being prepared for you.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Performance;
