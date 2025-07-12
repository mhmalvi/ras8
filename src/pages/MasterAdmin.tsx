
import { useEffect, useState } from 'react';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import MasterAdminDashboard from '@/components/MasterAdminDashboard';
import MasterAdminSidebar from '@/components/MasterAdminSidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

const MasterAdmin = () => {
  const { user, loading: authLoading } = useAtomicAuth();
  const { profile, loading: profileLoading } = useMerchantProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    console.log('🔐 Master Admin access attempt:', { 
      user: !!user, 
      profile,
      userEmail: user?.email 
    });
  }, [user, profile]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-b-primary/40 animate-pulse"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-slate-900">Verifying Admin Access</h3>
            <p className="text-slate-600 mt-1">Checking credentials and permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100">
        <div className="max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Authentication Required</h2>
            <p className="text-slate-600 mt-2">You must be signed in to access the master admin panel.</p>
          </div>
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              Please sign in with proper admin credentials to continue.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Strict master admin access control
  const isMasterAdmin = user?.email === 'aalvi.hm@gmail.com' || 
                        profile?.role === 'master_admin' ||
                        user?.email?.endsWith('@admin.returnsauto.com');

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100">
        <div className="max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
            <p className="text-slate-600 mt-2">Master admin privileges are required to access this area.</p>
          </div>
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <div className="font-medium">Insufficient permissions</div>
                {user?.email && (
                  <div className="text-sm opacity-90">
                    Current user: {user.email}
                  </div>
                )}
                <div className="text-sm opacity-75">
                  Contact your system administrator for access.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Master Admin Dashboard - completely isolated layout without SidebarProvider
  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20">
      <MasterAdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className="flex-1 overflow-hidden">
        <MasterAdminDashboard />
      </div>
    </div>
  );
};

export default MasterAdmin;
