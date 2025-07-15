
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import MasterAdminDashboard from '@/components/MasterAdminDashboard';
import MasterAdminSidebar from '@/components/MasterAdminSidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Lock, Crown } from 'lucide-react';

// Import tab components
import SystemHealthTab from '@/components/master-admin/SystemHealthTab';
import MerchantsTab from '@/components/master-admin/MerchantsTab'; 
import MonitoringTab from '@/components/master-admin/MonitoringTab';
import ReportsTab from '@/components/master-admin/ReportsTab';
import SettingsTab from '@/components/master-admin/SettingsTab';

const MasterAdmin = () => {
  const { user, loading: authLoading } = useAtomicAuth();
  const { profile, loading: profileLoading } = useMerchantProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Get the current tab from URL parameters
  const currentTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    console.log('🔐 Master Admin access attempt:', { 
      user: !!user, 
      profile,
      userEmail: user?.email,
      profileRole: profile?.role,
      currentTab
    });
  }, [user, profile, currentTab]);

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

  // Enhanced master admin access control - check both email and profile role
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
                {profile?.role && (
                  <div className="text-sm opacity-90">
                    Current role: {profile.role}
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

  // Function to render the appropriate tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case 'system':
        return <SystemHealthTab />;
      case 'tenants':
        return <MerchantsTab />;
      case 'monitoring':
        return <MonitoringTab />;
      case 'reports':
        return <ReportsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <MasterAdminDashboard />;
    }
  };

  // Master Admin Dashboard - completely isolated layout without SidebarProvider
  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20">
      <MasterAdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className="flex-1 overflow-hidden">
        <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100/50 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Master Admin Console
                </h1>
                <p className="text-slate-600 text-sm">
                  Welcome back, {user?.email} • System Status: Operational • Last Updated: 2:34:19 AM
                </p>
              </div>
              <div className="ml-auto">
                <button className="px-4 py-2 bg-white/60 hover:bg-white/80 border border-purple-200/50 rounded-lg text-purple-700 text-sm font-medium transition-colors">
                  🔄 Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MasterAdmin;
