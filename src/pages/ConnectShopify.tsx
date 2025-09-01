/**
 * Connect Shopify Page - For new users without merchant link
 * 
 * This page is shown to authenticated users who don't have a merchant
 * integration yet. It provides a clean interface to connect their Shopify store.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';
import { useLandingDecision } from '@/components/UnifiedProtectedRoute';
import { ExternalLink, Shield, Zap, BarChart3, ArrowRight, Store, CheckCircle } from 'lucide-react';

const ConnectShopify = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [connecting, setConnecting] = useState(false);
  const { user } = useAtomicAuth();
  const { refreshDecision } = useLandingDecision();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Shopify App configuration
  const SCOPES = 'read_orders,write_orders,read_customers,read_products';
  const CALLBACK_URL = `${window.location.origin}/auth/callback`;
  const CLIENT_ID = '2da34c83e89f6645ad1fb2028c7532dd';

  const handleConnect = async () => {
    if (!shopDomain.trim()) {
      toast({
        title: "Shop domain required",
        description: "Please enter your Shopify shop domain.",
        variant: "destructive",
      });
      return;
    }

    // Clean up shop domain
    let cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!cleanDomain.includes('.myshopify.com') && !cleanDomain.includes('.')) {
      cleanDomain = `${cleanDomain}.myshopify.com`;
      setShopDomain(cleanDomain);
    }

    setConnecting(true);

    try {
      // Generate state parameter for security
      const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('shopify_oauth_state', state);

      // Build Shopify OAuth URL
      const authUrl = new URL(`https://${cleanDomain}/admin/oauth/authorize`);
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('scope', SCOPES);
      authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
      authUrl.searchParams.set('state', state);

      console.log('🚀 Starting Shopify OAuth for new merchant:', {
        shopDomain: cleanDomain,
        userId: user?.id
      });

      // Redirect to Shopify OAuth
      window.location.href = authUrl.toString();

    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection failed",
        description: "There was an error connecting to your store.",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Returns Automation</h1>
                <p className="text-sm text-gray-600">Connect your Shopify store</p>
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
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Ready to Connect
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Connect Your Store
              </span>
              <br />
              <span className="text-gray-900">Start Managing Returns</span>
            </h2>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Link your Shopify store to unlock AI-powered returns automation, 
              exchange optimization, and detailed analytics.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-2xl w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Recommendations</h3>
              <p className="text-gray-600 text-sm">Smart suggestions turn 70% of returns into exchanges</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-2xl w-fit mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-gray-600 text-sm">Deep insights into return patterns and revenue impact</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-2xl w-fit mx-auto mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600 text-sm">GDPR compliant with bank-level security</p>
            </div>
          </div>

          {/* Connection Card */}
          <Card className="max-w-lg mx-auto shadow-2xl border-0 bg-white">
            <CardHeader className="text-center pb-6">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-2xl w-fit mx-auto mb-4">
                <Store className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Connect Your Shopify Store</CardTitle>
              <CardDescription className="text-base">
                Enter your store domain to link your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="shop-domain" className="block text-sm font-semibold text-gray-700 mb-3">
                    Shopify Store Domain
                  </label>
                  <Input
                    id="shop-domain"
                    type="text"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="your-store.myshopify.com"
                    className="h-12 text-base border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={connecting}
                  />
                </div>
                
                <Button 
                  onClick={handleConnect}
                  disabled={connecting || !shopDomain.trim()}
                  className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {connecting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Store
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {/* What Happens Next */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">What happens next:</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Secure redirect to your Shopify admin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Grant permissions for returns management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Automatic setup and configuration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Access your returns dashboard</span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <span className="font-medium">Secure Connection:</span>
                    <div className="mt-1">
                      Your store data is encrypted and protected. We only access 
                      the minimum permissions needed for returns processing.
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                By connecting, you agree to our{' '}
                <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
              </p>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Need help connecting your store?
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
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectShopify;