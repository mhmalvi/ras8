
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/LoadingStates";

const Performance = () => {
  return (
    <AppLayout 
      title="Performance" 
      description="Monitor system performance and optimization metrics"
    >
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring</CardTitle>
          <CardDescription>
            Track system performance, response times, and optimization opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <LoadingSpinner text="Performance data loading..." />
            <p className="text-muted-foreground mt-4">
              Performance monitoring dashboard is being prepared for you.
            </p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Performance;
