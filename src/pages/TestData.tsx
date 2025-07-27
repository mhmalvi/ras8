
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import UserMenu from "@/components/UserMenu";
import MerchantAssignment from "@/components/MerchantAssignment";
import ProfileCreator from "@/components/ProfileCreator";

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
                  <p className="text-sm text-slate-500">Development and testing utilities</p>
                </div>
              </div>
              <UserMenu />
            </div>
          </header>

          <main className="px-6 py-8 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Profile Creation */}
              <div className="flex justify-center">
                <ProfileCreator />
              </div>

              {/* Merchant Assignment */}
              <div className="flex justify-center">
                <MerchantAssignment />
              </div>

            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default TestData;
