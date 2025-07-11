
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import UserMenu from "@/components/UserMenu";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCreator from "@/components/ProfileCreator";
import MerchantAssignment from "@/components/MerchantAssignment";
import NotificationCenter from "@/components/NotificationCenter";
import { LoadingSpinner } from "@/components/LoadingStates";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const AppLayout = ({ children, title = "Dashboard", description }: AppLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refetch } = useProfile();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading || profileLoading) {
        console.warn('⚠️ Loading timeout reached');
        setLoadingTimeout(true);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timer);
  }, [authLoading, profileLoading]);

  // Show loading spinner with timeout fallback
  if ((authLoading || profileLoading) && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  // Handle loading timeout
  if (loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Loading is taking longer than expected</h2>
          <p className="text-slate-600">This might be a temporary issue. Please try refreshing.</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Handle authentication failure
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Handle profile error
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Profile Error</h2>
          <p className="text-slate-600">{profileError}</p>
          <Button onClick={refetch} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
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

  // User is authenticated with profile - show main app layout
  // Allow access even without merchant assignment (show setup in main content)
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
            {/* Show merchant assignment alert if needed */}
            {!profile.merchant_id && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to assign yourself to a merchant to access full functionality. 
                  Visit the main dashboard to set this up.
                </AlertDescription>
              </Alert>
            )}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
