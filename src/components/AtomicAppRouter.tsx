
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppBridgeProvider, useAppBridge } from '@/components/AppBridgeProvider';
import { ShopifyEmbeddedErrorBoundary } from '@/components/ShopifyEmbeddedErrorBoundary';
import { AtomicAuthProvider } from '@/contexts/AtomicAuthContext';
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from 'react-error-boundary';
import MerchantProtectedRoute from '@/components/MerchantProtectedRoute';
import AtomicProtectedRoute from '@/components/AtomicProtectedRoute';
import AtomicPublicRoute from '@/components/AtomicPublicRoute';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Returns from '@/pages/Returns';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import SettingsBilling from '@/pages/SettingsBilling';
import SettingsWebhooks from '@/pages/SettingsWebhooks';
import SettingsIntegrations from '@/pages/SettingsIntegrations';
import SettingsAutomation from '@/pages/SettingsAutomation';
import SettingsSystem from '@/pages/SettingsSystem';
import Auth from '@/pages/Auth';
import CustomerPortal from '@/pages/CustomerPortal';
import Automations from '@/pages/Automations';
import MasterAdmin from '@/pages/MasterAdmin';
import DebugPanel from '@/pages/DebugPanel';
import Database from '@/pages/Database';
import Logs from '@/pages/Logs';
import ApiMonitor from '@/pages/ApiMonitor';
import UserManagement from '@/pages/UserManagement';
import SystemReports from '@/pages/SystemReports';
import SupportCenter from '@/pages/SupportCenter';
import AIInsights from '@/pages/AIInsights';
import Customers from '@/pages/Customers';
import Products from '@/pages/Products';
import Performance from '@/pages/Performance';
import Billing from '@/pages/Billing';
import Notifications from '@/pages/Notifications';
import Security from '@/pages/Security';
import Integrations from '@/pages/Integrations';
import Webhooks from '@/pages/Webhooks';
import ShopifyInstall from '@/pages/ShopifyInstall';
import ShopifyInstallEnhanced from '@/pages/ShopifyInstallEnhanced';
import ShopifyTesting from '@/pages/ShopifyTesting';
import ShopifyGDPRWebhooks from '@/pages/ShopifyGDPRWebhooks';
import AuthInline from '@/pages/AuthInline';
import ConnectShopify from '@/pages/ConnectShopify';
import ReconnectShopify from '@/pages/ReconnectShopify';
import DebugAuth from '@/pages/DebugAuth';
import EmbedTest from '@/pages/EmbedTest';
import ShopifyOAuthCallback from '@/pages/ShopifyOAuthCallback';
import ShopifyAuthCallback from '@/pages/ShopifyAuthCallback';
import PreferencesPage from '@/pages/PreferencesPage';
import StartOAuth from '@/pages/StartOAuth';
import DiagnosticTest from '@/pages/DiagnosticTest';
import QuickTest from '@/pages/QuickTest';
import AppRedirectHandler from '@/pages/AppRedirectHandler';
import EmbedDebug from '@/pages/EmbedDebug';
import OAuthStart from '@/pages/OAuthStart';
import PartnerPlatformTest from '@/pages/PartnerPlatformTest';
import HealthCheck from '@/pages/HealthCheck';
import EnvironmentTest from '@/pages/EnvironmentTest';

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  const isHookError = error.message.includes('hook') || error.message.includes('Hook');
  const isNetworkError = error.message.includes('network') || error.message.includes('fetch');
  
  // Log detailed error for debugging
  console.error('🚨 App Error Boundary Caught:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    isHookError,
    isNetworkError
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 p-6 max-w-lg border rounded-lg bg-card">
        <div className="text-4xl mb-4">
          {isHookError ? '⚠️' : isNetworkError ? '🌐' : '💥'}
        </div>
        
        <h2 className="text-xl font-semibold text-red-600">
          {isHookError ? 'Component Error' : 
           isNetworkError ? 'Network Error' : 
           'Application Error'}
        </h2>
        
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">{error.message}</p>
          
          {isHookError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
              <p className="text-yellow-800">
                This appears to be a React hook issue. The page will reload automatically.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 justify-center">
          <button 
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Reload Page
          </button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <details>
            <summary className="cursor-pointer">Technical Details</summary>
            <pre className="mt-2 text-left bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

// Component that only handles App Bridge initialization - no routing logic
const AppBridgeAwareRoute = ({ children }: { children: React.ReactNode }) => {
  const { isEmbedded, loading } = useAppBridge();
  
  // Show loading only while App Bridge is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Initializing App Bridge...</span>
        </div>
      </div>
    );
  }
  
  // Log App Bridge state for debugging but don't redirect
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');
  const currentPath = window.location.pathname;
  
  console.log('🔍 AppBridge State:', {
    isEmbedded,
    shop: !!shop,
    host: !!host,
    currentPath
  });
  
  // Always render children - let AtomicProtectedRoute handle all routing logic
  return <>{children}</>;
};


const AtomicAppRouter = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('💥 App Error:', error, errorInfo);
      }}
    >
      <BrowserRouter future={{ v7_startTransition: true }}>
        <AppBridgeProvider>
          <AtomicAuthProvider>
            <ShopifyEmbeddedErrorBoundary>
              <div className="min-h-screen bg-background">
                <Routes>
            {/* Public Routes */}
            <Route path="/landing" element={<Index />} />
            <Route path="/return-portal" element={<CustomerPortal />} />
            <Route path="/shopify/install" element={<ShopifyInstallEnhanced />} />
            <Route path="/install" element={<ShopifyInstallEnhanced />} />
            
            {/* Shopify Connection Routes */}
            <Route path="/connect-shopify" element={<ConnectShopify />} />
            <Route path="/reconnect" element={<ReconnectShopify />} />
            
            {/* Shopify Auth Inline - Top-level re-embed page */}
            <Route path="/auth/inline" element={<AuthInline />} />
            
            {/* App redirect handler for Partner Dashboard app URL redirects */}
            <Route path="/apps/ras" element={<AppRedirectHandler />} />
            <Route path="/apps/ras/*" element={<AppRedirectHandler />} />
            {/* Handle client ID based URLs from Shopify Admin */}
            <Route path="/apps/2da34c83e89f6645ad1fb2028c7532dd" element={<AppRedirectHandler />} />
            <Route path="/apps/2da34c83e89f6645ad1fb2028c7532dd/*" element={<AppRedirectHandler />} />
            {/* Generic pattern for any app client ID */}
            <Route path="/apps/:clientId" element={<AppRedirectHandler />} />
            <Route path="/apps/:clientId/*" element={<AppRedirectHandler />} />
            
            {/* OAuth callbacks - Partner Platform URLs */}
            <Route path="/auth/callback" element={<ShopifyAuthCallback />} />
            <Route path="/auth/shopify/callback" element={<ShopifyAuthCallback />} />
            
            {/* OAuth initiation endpoints */}
            <Route path="/functions/v1/shopify-oauth-start" element={<OAuthStart />} />
            <Route path="/auth/start" element={<OAuthStart />} />
            <Route path="/oauth/start" element={<OAuthStart />} />
            
            {/* Preferences URL for Partner Platform */}
            <Route path="/preferences" element={<PreferencesPage />} />
            
            {/* Debug page for troubleshooting */}
            <Route path="/debug-auth" element={<DebugAuth />} />
            <Route path="/embed-test" element={<EmbedTest />} />
            <Route path="/embed-debug" element={<EmbedDebug />} />
            <Route path="/start-oauth" element={<StartOAuth />} />
            <Route path="/diagnostic" element={<DiagnosticTest />} />
            <Route path="/quick-test" element={<QuickTest />} />
            <Route path="/partner-platform-test" element={<PartnerPlatformTest />} />
            <Route path="/environment-test" element={<EnvironmentTest />} />
            <Route path="/health" element={<HealthCheck />} />
            <Route path="/status" element={<HealthCheck />} />
            
            {/* Shopify GDPR Webhooks */}
            <Route path="/functions/v1/shopify-gdpr-webhooks" element={<ShopifyGDPRWebhooks />} />
            
            {/* Auth Route - only accessible when logged out */}
            <Route 
              path="/auth" 
              element={
                <AtomicPublicRoute>
                  <Auth />
                </AtomicPublicRoute>
              } 
            />
            
            {/* Master Admin Routes - highest security */}
            <Route 
              path="/master-admin" 
              element={
                <MerchantProtectedRoute>
                  <MasterAdmin />
                </MerchantProtectedRoute>
              } 
            />
            <Route 
              path="/debug" 
              element={
                <MerchantProtectedRoute>
                  <DebugPanel />
                </MerchantProtectedRoute>
              } 
            />
            <Route 
              path="/database" 
              element={
                <MerchantProtectedRoute>
                  <Database />
                </MerchantProtectedRoute>
              } 
            />
            <Route 
              path="/logs" 
              element={
                <MerchantProtectedRoute>
                  <Logs />
                </MerchantProtectedRoute>
              } 
            />
            <Route 
              path="/api-monitor" 
              element={
                <MerchantProtectedRoute>
                  <ApiMonitor />
                </MerchantProtectedRoute>
              } 
            />
            <Route 
              path="/user-management" 
              element={
                <MerchantProtectedRoute>
                  <UserManagement />
                </MerchantProtectedRoute>
              } 
            />
            <Route 
              path="/system-reports" 
              element={
                <MerchantProtectedRoute>
                  <SystemReports />
                </MerchantProtectedRoute>
              } 
            />
            <Route 
              path="/support" 
              element={
                <MerchantProtectedRoute>
                  <SupportCenter />
                </MerchantProtectedRoute>
              } 
            />
            
            {/* Shopify App Default Route - Protected routing handles both embedded and standalone */}
            <Route 
              path="/" 
              element={
                <AtomicProtectedRoute>
                  <Dashboard />
                </AtomicProtectedRoute>
              }
            />
            
            {/* Dashboard Route - Protected (Smart routing for embedded vs standalone) */}
            <Route 
              path="/dashboard" 
              element={
                <AtomicProtectedRoute>
                  <Dashboard />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/returns" 
              element={
                <AtomicProtectedRoute>
                  <Returns />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <AtomicProtectedRoute>
                  <Analytics />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/ai-insights" 
              element={
                <AtomicProtectedRoute>
                  <AIInsights />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/customers" 
              element={
                <AtomicProtectedRoute>
                  <Customers />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <AtomicProtectedRoute>
                  <Products />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/performance" 
              element={
                <AtomicProtectedRoute>
                  <Performance />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/billing" 
              element={
                <AtomicProtectedRoute>
                  <Billing />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <AtomicProtectedRoute>
                  <Settings />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/settings/billing" 
              element={
                <AtomicProtectedRoute>
                  <SettingsBilling />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/settings/webhooks" 
              element={
                <AtomicProtectedRoute>
                  <SettingsWebhooks />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/settings/integrations" 
              element={
                <AtomicProtectedRoute>
                  <SettingsIntegrations />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/settings/automation" 
              element={
                <AtomicProtectedRoute>
                  <SettingsAutomation />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/settings/system" 
              element={
                <AtomicProtectedRoute>
                  <SettingsSystem />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <AtomicProtectedRoute>
                  <Notifications />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/automations" 
              element={
                <AtomicProtectedRoute>
                  <Automations />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/security" 
              element={
                <AtomicProtectedRoute>
                  <Security />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/integrations" 
              element={
                <AtomicProtectedRoute>
                  <Integrations />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/webhooks" 
              element={
                <AtomicProtectedRoute>
                  <Webhooks />
                </AtomicProtectedRoute>
              } 
            />
            <Route 
              path="/shopify/testing" 
              element={
                <MerchantProtectedRoute>
                  <ShopifyTesting />
                </MerchantProtectedRoute>
              } 
            />
            
            {/* Error/Fallback Routes */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                  <p className="text-muted-foreground mb-4">You don't have permission to access this resource.</p>
                  <a href="/auth" className="text-primary hover:underline">Sign In</a>
                </div>
              </div>
            } />
            
            <Route path="/loading" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              </div>
            } />
            
            <Route path="/error" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-red-600 mb-2">An Error Occurred</h2>
                  <p className="text-muted-foreground mb-4">We're sorry, something went wrong.</p>
                  <a href="/" className="text-primary hover:underline">Go to Dashboard</a>
                </div>
              </div>
            } />
            
            {/* Catch all - redirect to dashboard for authenticated users */}
            <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster />
                </div>
            </ShopifyEmbeddedErrorBoundary>
          </AtomicAuthProvider>
        </AppBridgeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default AtomicAppRouter;
