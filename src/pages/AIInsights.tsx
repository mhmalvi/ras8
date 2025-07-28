
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import EnhancedAIInsights from "@/components/EnhancedAIInsights";
import AppLayout from "@/components/AppLayout";
import { Brain, RefreshCw } from "lucide-react";

const AIInsights = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  AI Insights
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Leverage artificial intelligence to optimize your returns process
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
          
          {/* AI Insights Content */}
          <section className="animate-fade-in">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <span>AI-Powered Insights</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Smart recommendations and predictions to improve your returns management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedAIInsights />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIInsights;
