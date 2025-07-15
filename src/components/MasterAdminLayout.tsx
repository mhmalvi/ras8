import React, { useState } from 'react';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import MasterAdminSidebar from '@/components/MasterAdminSidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface MasterAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const MasterAdminLayout = ({ children, title, description }: MasterAdminLayoutProps) => {
  const { user, loading: authLoading } = useAtomicAuth();
  const { profile, loading: profileLoading } = useMerchantProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Security check - only master admins can use this layout
  const isMasterAdmin = user?.email === 'aalvi.hm@gmail.com' || 
                        profile?.role === 'master_admin' ||
                        user?.email?.endsWith('@admin.returnsauto.com');

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
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please sign in with your admin credentials to continue.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100">
        <div className="max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
            <p className="text-slate-600 mt-2">You don't have permission to access the master admin panel.</p>
          </div>
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Master Admin Access Required</div>
                <div className="text-sm">This area is restricted to system administrators only.</div>
                <div className="text-xs text-red-600/80 mt-2">
                  User: {user.email} | Role: {profile?.role || 'none'}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-100 flex">
      <MasterAdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {(title || description) && (
          <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100/50 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              {title && (
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-slate-600 mt-1 text-sm">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MasterAdminLayout;