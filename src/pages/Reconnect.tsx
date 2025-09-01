/**
 * Reconnect Page - For users with uninstalled or invalid tokens
 * 
 * This page is shown to users whose merchant integration needs to be
 * refreshed due to app uninstall, token expiry, or other issues.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useLandingDecision } from '@/components/UnifiedProtectedRoute';
import { refreshMerchantIntegration } from '@/utils/landingResolver';
import { 
  RefreshCw, 
  AlertCircle, 
  Shield, 
  Store, 
  Clock, 
  CheckCircle2,
  ExternalLink,
  ArrowRight 
} from 'lucide-react';

interface ReconnectReason {
  type: 'uninstalled' | 'expired' | 'invalid' | 'unknown';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Reconnect = () => {
  const [reconnecting, setReconnecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [reconnectReason, setReconnectReason] = useState<ReconnectReason | null>(null);
  const { user } = useAtomicAuth();
  const { refreshDecision } = useLandingDecision();
  const { toast } = useToast();
  const navigate = useNavigate();

  // OAuth configuration
  const SCOPES = 'read_orders,write_orders,read_customers,read_products';
  const CALLBACK_URL = `${window.location.origin}/auth/callback`;
  const CLIENT_ID = '2da34c83e89f6645ad1fb2028c7532dd';

  // Determine reconnect reason based on URL params or storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reason = urlParams.get('reason') || localStorage.getItem('reconnect_reason');
    
    const reasons: Record<string, ReconnectReason> = {
      uninstalled: {
        type: 'uninstalled',
        title: 'App was uninstalled',
        description: 'Your Shopify store app has been uninstalled. Reconnect to restore access.',
        icon: <Store className="h-6 w-6 text-orange-600" />
      },
      expired: {
        type: 'expired',
        title: 'Access token expired',
        description: 'Your store connection has expired. Refresh your authorization to continue.',
        icon: <Clock className="h-6 w-6 text-yellow-600" />
      },
      invalid: {
        type: 'invalid',
        title: 'Invalid authorization',
        description: 'Your store connection is no longer valid. Please reauthorize the app.',
        icon: <AlertCircle className="h-6 w-6 text-red-600" />
      }
    };

    setReconnectReason(reasons[reason || 'unknown'] || {
      type: 'unknown',
      title: 'Connection required',
      description: 'Your store needs to be reconnected to continue using the app.',
      icon: <RefreshCw className="h-6 w-6 text-blue-600" />
    });
  }, []);

  const handleReconnect = async () => {
    setReconnecting(true);

    try {
      // For now, we'll redirect to the general OAuth flow
      // In a real implementation, you might want to detect the shop domain
      // from the existing merchant record
      
      // Check if we have shop domain from previous integration
      const shopDomain = localStorage.getItem('last_shop_domain') || 
                        sessionStorage.getItem('shop_domain');

      if (shopDomain) {
        // Generate state parameter for security
        const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('shopify_oauth_state', state);

        // Build Shopify OAuth URL
        const authUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
        authUrl.searchParams.set('client_id', CLIENT_ID);
        authUrl.searchParams.set('scope', SCOPES);
        authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
        authUrl.searchParams.set('state', state);

        console.log('🔄 Starting Shopify reconnect OAuth:', {
          shopDomain,
          userId: user?.id,
          reason: reconnectReason?.type
        });

        // Redirect to Shopify OAuth
        window.location.href = authUrl.toString();
      } else {
        // No shop domain found, redirect to connect page
        navigate('/connect-shopify');
      }

    } catch (error) {
      console.error('Reconnection error:', error);
      toast({
        title: "Reconnection failed",
        description: "There was an error reconnecting your store.",
        variant: "destructive",
      });
      setReconnecting(false);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);

    try {
      console.log('🔍 Checking merchant integration status...');
      
      if (user) {
        await refreshMerchantIntegration(user.id);
        await refreshDecision();
        
        toast({
          title: "Status refreshed",
          description: "Your connection status has been updated.",
        });
      }
    } catch (error) {
      console.error('Status check error:', error);
      toast({
        title: "Status check failed",
        description: "Could not check your connection status.",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Returns Automation</h1>
                <p className="text-sm text-gray-600">Reconnection required</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              Signed in as {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Status Alert */}
          <div className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                {reconnectReason?.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {reconnectReason?.title || 'Reconnection Required'}
                </h2>
                <p className="text-gray-700 mb-4">
                  {reconnectReason?.description || 'Your store connection needs to be refreshed.'}
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  Action required to continue using the app
                </div>
              </div>
            </div>
          </div>

          {/* Reconnection Card */}
          <Card className="shadow-2xl border-0 bg-white mb-8">
            <CardHeader className="text-center pb-6">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-2xl w-fit mx-auto mb-4">
                <Store className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Reconnect Your Store</CardTitle>
              <CardDescription className="text-base">
                Restore your connection to continue managing returns
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleReconnect}
                  disabled={reconnecting}
                  className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {reconnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Reconnect Store
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline"
                  onClick={handleCheckStatus}
                  disabled={checkingStatus}
                  className="w-full h-10"
                >
                  {checkingStatus ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Connection Status
                    </>
                  )}
                </Button>
              </div>

              {/* What This Does */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">What reconnecting does:</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Refresh your store authorization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Restore access to returns management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Resume analytics and reporting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Maintain all your existing data</span>
                  </div>
                </div>
              </div>

              {/* Common Issues */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <div className="text-xs text-blue-800">
                  <div className="font-medium mb-1">Common reasons for reconnection:</div>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>App was uninstalled from Shopify admin</li>
                    <li>Store ownership or permissions changed</li>
                    <li>Security tokens expired (happens periodically)</li>
                    <li>Store domain or settings were updated</li>
                  </ul>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 p-3 rounded-xl">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-green-800">
                    <span className="font-medium">Secure Process:</span>
                    <div className="mt-1">
                      Reconnecting is completely safe. Your existing data, settings, 
                      and analytics are preserved throughout the process.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Actions */}
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Having trouble reconnecting?
            </p>
            <div className="flex items-center justify-center gap-6">
              <a 
                href="mailto:support@returnsautomation.com" 
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
              >
                Contact Support
              </a>
              <a 
                href="#" 
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Troubleshooting Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reconnect;