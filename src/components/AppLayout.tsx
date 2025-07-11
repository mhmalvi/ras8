
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import UserMenu from "@/components/UserMenu";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCreator from "@/components/ProfileCreator";
import MerchantAssignment from "@/components/MerchantAssignment";
import NotificationCenter from "@/components/NotificationCenter";
import { LoadingSpinner } from "@/components/LoadingStates";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const AppLayout = ({ children, title = "Dashboard", description }: AppLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Show loading spinner while authentication is being determined
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // If user is not authenticated, this should be handled by ProtectedRoute
  // but adding fallback just in case
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  // If no profile exists, show profile creator
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto p-6">
          <ProfileCreator />
        </div>
      </div>
    );
  }

  // User is authenticated - show main app layout
  // Note: We'll handle merchant assignment within the dashboard rather than blocking access
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                {description && (
                  <p className="text-slate-500">{description}</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <NotificationCenter />
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
