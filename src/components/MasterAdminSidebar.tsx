
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import {
  BarChart3,
  Activity,
  Store,
  Eye,
  Download,
  Settings,
  Bug,
  Database,
  FileText,
  Monitor,
  Crown,
  UserCog,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MasterAdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const MasterAdminSidebar = ({ collapsed, onToggle }: MasterAdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAtomicAuth();
  const { profile } = useMerchantProfile();
  const currentPath = location.pathname;

  // Security check - only master admins can use this sidebar
  const isMasterAdmin = profile?.role === 'master_admin';

  // If not master admin, show access denied
  if (!isMasterAdmin) {
    return (
      <Card className="w-72 h-full border-r-2 border-red-200 bg-red-50">
        <div className="p-4">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Access Restricted</div>
                <div className="text-sm">Master admin access required</div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    );
  }

  const developmentItems = [
    { id: 'debug', label: 'Debug Panel', icon: Bug, path: '/debug' },
    { id: 'database', label: 'Database', icon: Database, path: '/database' },
    { id: 'logs', label: 'Logs', icon: FileText, path: '/logs' },
    { id: 'monitor', label: 'API Monitor', icon: Monitor, path: '/api-monitor' },
  ];

  const adminItems = [
    { id: 'master-admin', label: 'Master Admin', icon: Crown, path: '/master-admin' },
    { id: 'user-mgmt', label: 'User Management', icon: UserCog, path: '/user-management' },
    { id: 'reports', label: 'System Reports', icon: FileText, path: '/system-reports' },
    { id: 'support', label: 'Support Center', icon: MessageSquare, path: '/support' },
  ];

  const mainItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, path: '/master-admin' },
    { id: 'system', label: 'System Health', icon: Activity, path: '/master-admin?tab=system' },
    { id: 'merchants', label: 'Merchants', icon: Store, path: '/master-admin?tab=tenants' },
    { id: 'monitoring', label: 'Monitoring', icon: Eye, path: '/master-admin?tab=monitoring' },
    { id: 'reports', label: 'Reports', icon: Download, path: '/master-admin?tab=reports' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/master-admin?tab=settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/master-admin') {
      return currentPath === '/master-admin' && !location.search;
    }
    return currentPath === path || location.pathname + location.search === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Card className={`h-full border-r-2 border-purple-100 bg-gradient-to-b from-white to-purple-50/30 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-72'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-purple-100/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Master Admin
                </h2>
                <p className="text-xs text-purple-600/70 font-medium">System Control</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-purple-100"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 space-y-6 overflow-y-auto flex-1">
        {/* Main Navigation */}
        <div>
          {!collapsed && (
            <h3 className="text-xs font-semibold text-purple-800/70 uppercase tracking-wider mb-3 px-2">
              Dashboard
            </h3>
          )}
          <div className="space-y-1">
            {mainItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-purple-500/15 to-blue-500/10 text-purple-700 shadow-sm border border-purple-200/50'
                    : 'hover:bg-purple-100/50 text-slate-600 hover:text-purple-700'
                }`}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${
                  isActive(item.path) ? 'text-purple-600' : 'text-slate-500 group-hover:text-purple-600'
                }`} />
                {!collapsed && (
                  <span className="font-medium text-sm truncate">{item.label}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Development Section */}
        <div>
          {!collapsed && (
            <h3 className="text-xs font-semibold text-amber-700/70 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <Bug className="h-3 w-3" />
              Development
            </h3>
          )}
          <div className="space-y-1">
            {developmentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-700 shadow-sm border border-amber-200/50'
                    : 'hover:bg-amber-100/50 text-slate-600 hover:text-amber-700'
                }`}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${
                  isActive(item.path) ? 'text-amber-600' : 'text-slate-500 group-hover:text-amber-600'
                }`} />
                {!collapsed && (
                  <span className="font-medium text-sm truncate">{item.label}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Admin Section */}
        <div>
          {!collapsed && (
            <h3 className="text-xs font-semibold text-yellow-700/70 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <Crown className="h-3 w-3" />
              Admin
            </h3>
          )}
          <div className="space-y-1">
            {adminItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-yellow-500/15 to-orange-500/10 text-yellow-700 shadow-sm border border-yellow-200/50'
                    : 'hover:bg-yellow-100/50 text-slate-600 hover:text-yellow-700'
                }`}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${
                  isActive(item.path) ? 'text-yellow-600' : 'text-slate-500 group-hover:text-yellow-600'
                }`} />
                {!collapsed && (
                  <span className="font-medium text-sm truncate">{item.label}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-purple-100/50 bg-gradient-to-r from-purple-50/50 to-blue-50/30">
          <div className="text-center space-y-1">
            <p className="text-xs text-purple-600/80 font-medium">© 2024 Returns Automation</p>
            <p className="text-xs text-purple-500/60">v2.0.0 Master Console</p>
            <div className="flex items-center justify-center gap-1 text-yellow-600 mt-2">
              <Crown className="h-3 w-3" />
              <span className="text-xs font-semibold">Elite Access</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MasterAdminSidebar;
