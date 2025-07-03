
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIRecommendationEngine from "@/components/AIRecommendationEngine";
import PredictiveAnalytics from "@/components/PredictiveAnalytics";
import CustomerCommunicationAutomation from "@/components/CustomerCommunicationAutomation";
import EnhancedAIInsights from "@/components/EnhancedAIInsights";
import { Brain, Target, TrendingUp, MessageSquare } from "lucide-react";

const AIInsights = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">AI Insights & Automation</h1>
                <p className="text-sm text-slate-500">Comprehensive AI-powered analytics, recommendations, and automation</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="recommendations" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="recommendations" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    AI Recommendations
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Predictive Analytics
                  </TabsTrigger>
                  <TabsTrigger value="communication" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Communication Automation
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Performance
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="recommendations">
                  <AIRecommendationEngine />
                </TabsContent>

                <TabsContent value="analytics">
                  <PredictiveAnalytics />
                </TabsContent>

                <TabsContent value="communication">
                  <CustomerCommunicationAutomation />
                </TabsContent>

                <TabsContent value="insights">
                  <EnhancedAIInsights />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AIInsights;
