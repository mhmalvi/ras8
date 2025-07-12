
import { useEffect } from 'react';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import MasterAdminDashboard from '@/components/MasterAdminDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingStates';

const MasterAdmin = () => {
  const { user, loading: authLoading } = useAtomicAuth();
  const { profile, loading: profileLoading } = useMerchantProfile();

  useEffect(() => {
    console.log('🔐 Master Admin access attempt:', { 
      user: !!user, 
      profile,
      userEmail: user?.email 
    });
  }, [user, profile]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verifying admin access..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Authentication required. Please sign in to access master admin panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // More flexible master admin access control
  const isMasterAdmin = user?.email?.includes('admin') || 
                        profile?.role === 'master_admin' ||
                        user?.email === 'aalvi.hm@gmail.com'; // Allow current user for testing

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. Master admin privileges required. 
            {user?.email && (
              <div className="mt-2 text-sm">
                Current user: {user.email}
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <MasterAdminDashboard />
    </div>
  );
};

export default MasterAdmin;
