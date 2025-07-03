
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import AIInsightsDashboard from "@/components/AIInsightsDashboard";

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
                <p className="text-sm text-slate-500">Advanced AI-powered analytics and recommendations</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <AIInsightsDashboard />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AIInsights;
