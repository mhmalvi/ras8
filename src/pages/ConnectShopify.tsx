import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, ShoppingBag, Zap, BarChart3, Users, Shield, CheckCircle, Info, Store } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const ConnectShopify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleShopifyAccountLogin = async () => {
    setIsConnecting(true);
    
    try {
      // Generate secure state for CSRF protection
      const state = btoa(JSON.stringify({
        next: next || '',
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7)
      })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      // Store state for callback validation
      sessionStorage.setItem('shopify_oauth_state', state);
      
      // Build Shopify Account OAuth URL
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
      const redirectUri = `${appUrl}/auth/shopify-account/callback`;
      
      // Shopify Account OAuth URL (different from store-specific OAuth)
      const shopifyAccountOAuthUrl = new URL('https://accounts.shopify.com/oauth/authorize');
      shopifyAccountOAuthUrl.searchParams.set('client_id', clientId);
      shopifyAccountOAuthUrl.searchParams.set('response_type', 'code');
      shopifyAccountOAuthUrl.searchParams.set('redirect_uri', redirectUri);
      shopifyAccountOAuthUrl.searchParams.set('state', state);
      shopifyAccountOAuthUrl.searchParams.set('scope', 'openid email profile https://api.shopify.com/auth/partners.readonly');
      
      console.log('🔐 Initiating Shopify Account OAuth:', {
        clientId: clientId ? 'present' : 'missing',
        redirectUri,
        state: state.substring(0, 20) + '...'
      });
      
      // Redirect to Shopify Account Login
      window.location.href = shopifyAccountOAuthUrl.toString();
      
    } catch (error) {
      console.error('Error initiating Shopify account login:', error);
      setIsConnecting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-primary mr-3" />
            <span className="text-3xl font-bold">Connect with Shopify</span>
          </div>
          <p className="text-muted-foreground text-lg">
            Login to your Shopify account to connect your stores with H5 Returns Automation
          </p>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Shopify Account Login:</strong> You'll login with your Shopify account credentials, 
            then select which store(s) you want to connect with H5. This provides secure access to 
            multiple stores and full automation features.
          </AlertDescription>
        </Alert>

        {/* Main Connection Card */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Store className="h-6 w-6 mr-2" />
              Connect Your Shopify Account
            </CardTitle>
            <CardDescription>
              Secure login with your existing Shopify account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 mb-3">How This Works</h3>
              <div className="grid gap-3 text-sm text-green-700">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    1
                  </div>
                  <div>
                    <strong>Login to Shopify:</strong> Use your existing Shopify account credentials
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    2
                  </div>
                  <div>
                    <strong>Select Your Store:</strong> Choose which store(s) to connect with H5
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    3
                  </div>
                  <div>
                    <strong>Grant Permissions:</strong> Authorize H5 to access orders, products, and customers
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    4
                  </div>
                  <div>
                    <strong>Start Automating:</strong> Full access to H5's returns management features
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleShopifyAccountLogin}
              size="lg" 
              disabled={isConnecting}
              className="bg-[#96bf48] hover:bg-[#87a642] text-white disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting to Shopify...
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Login with My Shopify Account
                </>
              )}
            </Button>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-blue-800">
                  <strong>100% Secure:</strong> This uses Shopify's official OAuth authentication. 
                  Your credentials are never shared with H5 - we only receive permission to access 
                  your store data for returns processing.
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              By connecting, you authorize H5 to read orders, products, customer data, and manage returns
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary" />
                Multi-Store Support
              </CardTitle>
              <CardDescription>
                Perfect for merchants with multiple Shopify stores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Connect multiple stores with one account</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Unified dashboard for all stores</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cross-store analytics and reporting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Centralized returns management</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-500" />
                Enterprise Security
              </CardTitle>
              <CardDescription>
                Built on Shopify's secure infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>OAuth 2.0 + OpenID Connect</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Shopify Partner API authentication</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Granular permission scopes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Revoke access anytime from Shopify</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <Card>
          <CardHeader>
            <CardTitle>What You Get After Connecting</CardTitle>
            <CardDescription>
              Full access to H5's powerful returns automation platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Real-time Analytics</h4>
                  <p className="text-sm text-muted-foreground">Returns insights and performance metrics</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Users className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Customer Management</h4>
                  <p className="text-sm text-muted-foreground">Automated communication and support</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Zap className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Process Automation</h4>
                  <p className="text-sm text-muted-foreground">Smart returns workflows and rules</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Information */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-purple-800 mb-2">Access Based on Your Plan</h3>
          <p className="text-sm text-purple-700">
            Your subscription tier (Starter, Growth, or Pro) determines feature access and usage limits. 
            All plans include secure Shopify integration and core returns management.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default ConnectShopify;