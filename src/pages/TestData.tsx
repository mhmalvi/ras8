
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import UserMenu from "@/components/UserMenu";
import SampleDataManager from "@/components/SampleDataManager";
import MerchantAssignment from "@/components/MerchantAssignment";

const TestData = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Test Data Management</h1>
                  <p className="text-sm text-slate-500">
                    Create sample data and configure merchant assignments for testing
                  </p>
                </div>
              </div>
              <UserMenu />
            </div>
          </header>

          <main className="px-6 py-8 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SampleDataManager />
                <MerchantAssignment />
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Testing Workflow</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h4 className="font-medium">Create Sample Data</h4>
                      <p className="text-sm text-slate-600">Click "Create Sample Data" to populate the database with realistic test data including merchants, returns, and AI suggestions.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h4 className="font-medium">Assign Merchant</h4>
                      <p className="text-sm text-slate-600">Select a merchant from the dropdown to associate your profile with their data for testing the dashboard and returns management.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h4 className="font-medium">Explore Features</h4>
                      <p className="text-sm text-slate-600">Navigate to the Dashboard, Returns, and Analytics pages to see the platform working with realistic data.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <h4 className="font-medium">Clean Up</h4>
                      <p className="text-sm text-slate-600">Use "Clear All Data" when finished testing to remove sample data from the database.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default TestData;
