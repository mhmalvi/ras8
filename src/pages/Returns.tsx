
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import EnhancedReturnsTable from "@/components/EnhancedReturnsTable";

const Returns = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Returns Management</h1>
                <p className="text-sm text-slate-500">Advanced filtering and export capabilities</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
              <EnhancedReturnsTable />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Returns;
