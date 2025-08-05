
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import UserMenu from "@/components/UserMenu";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";
import { useAtomicAuth } from "@/contexts/AtomicAuthContext";
import { useAppBridge } from "@/components/AppBridgeProvider";
import ProfileCreator from "@/components/ProfileCreator";
import { LoadingSpinner } from "@/components/LoadingStates";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading: authLoading } = useAtomicAuth();
  const { profile, loading: profileLoading, error: profileError, refetch } = useMerchantProfile();
  const { isEmbedded, loading: appBridgeLoading } = useAppBridge();
  const navigate = useNavigate();

  // Show loading for App Bridge initialization and authentication
  if (authLoading || appBridgeLoading || (profileLoading && !profileError)) {
    return (
      <div className={`${isEmbedded ? 'h-screen' : 'min-h-screen'} flex items-center justify-center`}>
        <LoadingSpinner size="lg" text={isEmbedded ? "Loading Shopify app..." : "Loading your dashboard..."} />
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

  // Handle profile error with better UX
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Unable to Load Profile</h2>
          <p className="text-slate-600">
            We're having trouble connecting to the database. This might be a temporary issue.
          </p>
          <div className="space-y-2">
            <Button onClick={refetch} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If no profile exists, show profile creator
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto p-6">
          <ProfileCreator />
        </div>
      </div>
    );
  }

  // User is authenticated with profile - show main app layout
  return (
    <SidebarProvider>
      <div className={`${isEmbedded ? 'h-screen' : 'min-h-screen'} flex w-full bg-background ${isEmbedded ? 'overflow-hidden' : ''}`}>
        {/* Only show sidebar when not embedded */}
        {!isEmbedded && <AppSidebar />}
        
        <div className="flex-1 flex flex-col">
          {/* Header - modified for embedded mode */}
          {!isEmbedded && (
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8 py-6">
              <div className="flex items-center justify-end space-x-4">
                <NotificationDropdown />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate('/support')}
                  className="relative"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
                <UserMenu />
              </div>
            </header>
          )}

          {/* Embedded mode header - minimal */}
          {isEmbedded && (
            <header className="border-b bg-background px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="font-semibold text-lg">Returns Automation</h1>
                <div className="flex items-center space-x-2">
                  <NotificationDropdown />
                  <UserMenu />
                </div>
              </div>
            </header>
          )}

          {/* Main Content - adjusted for embedded mode */}
          <main className={`flex-1 ${isEmbedded ? 'px-4 py-4 overflow-auto' : 'px-8 py-8'}`}>
            <div className={`${isEmbedded ? 'max-w-none' : 'max-w-6xl'} mx-auto`}>
              {/* Show merchant assignment alert if needed - hide in embedded mode */}
              {!isEmbedded && !profile.merchant_id && (
                <Alert className="mb-8">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to assign yourself to a merchant to access full functionality. 
                    Visit the main dashboard to set this up.
                  </AlertDescription>
                </Alert>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
