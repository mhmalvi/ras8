
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EnhancedAIInsights from "@/components/EnhancedAIInsights";
import AppLayout from "@/components/AppLayout";

const AIInsights = () => {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AI Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Leverage artificial intelligence to optimize your returns process
          </p>
        </div>
        
        <div className="bg-background rounded-lg border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">AI-Powered Insights</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Smart recommendations and predictions to improve your returns management
            </p>
          </div>
          <EnhancedAIInsights />
        </div>
      </div>
    </AppLayout>
  );
};

export default AIInsights;
