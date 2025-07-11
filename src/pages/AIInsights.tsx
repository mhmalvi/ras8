
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EnhancedAIInsights from "@/components/EnhancedAIInsights";
import AppLayout from "@/components/AppLayout";

const AIInsights = () => {
  return (
    <AppLayout 
      title="AI Insights" 
      description="Leverage artificial intelligence to optimize your returns process"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Insights</CardTitle>
            <CardDescription>
              Smart recommendations and predictions to improve your returns management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedAIInsights />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AIInsights;
