
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvancedAnalyticsDashboard from "@/components/AdvancedAnalyticsDashboard";
import BulkAIProcessor from "@/components/BulkAIProcessor";
import { Brain, TrendingUp, Zap } from "lucide-react";

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
                <h1 className="text-xl font-semibold text-slate-900">AI Insights</h1>
                <p className="text-sm text-slate-500">Advanced AI-powered analytics, predictions, and automation</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="analytics" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Advanced Analytics
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Bulk AI Processing
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics">
                  <AdvancedAnalyticsDashboard />
                </TabsContent>

                <TabsContent value="bulk">
                  <BulkAIProcessor />
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
