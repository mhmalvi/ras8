
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Shield, Zap, BarChart3, AlertCircle } from 'lucide-react';

const ShopifyInstallation = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [installing, setInstalling] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const { toast } = useToast();

  // Shopify App configuration
  const SCOPES = 'read_orders,write_orders,read_customers,read_products';
  const CALLBACK_URL = `${window.location.origin}/functions/v1/shopify-oauth-callback`;

  // Fetch Shopify configuration on component mount
  useEffect(() => {
    const fetchShopifyConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-shopify-config');
        
        if (error) {
          throw error;
        }

        if (data?.clientId) {
          setClientId(data.clientId);
          console.log('✅ Shopify Client ID loaded successfully');
        } else {
          setConfigError('Shopify Client ID not configured. Please contact support.');
        }
      } catch (error) {
        console.error('❌ Error fetching Shopify config:', error);
        setConfigError('Unable to load Shopify configuration. Please try again later.');
      }
    };

    fetchShopifyConfig();
  }, []);

  const handleInstall = async () => {
    if (!clientId) {
      toast({
        title: "Configuration error",
        description: "Shopify Client ID is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

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

    setInstalling(true);

    try {
      // Generate state parameter for security
      const state = crypto.randomUUID();
      sessionStorage.setItem('shopify_oauth_state', state);

      // Build Shopify OAuth URL with proper parameters for embedded app
      const authUrl = new URL(`https://${cleanDomain}/admin/oauth/authorize`);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('scope', SCOPES);
      authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('grant_options[]', 'per-user'); // For proper app embedding

      console.log('🚀 Redirecting to Shopify OAuth:', authUrl.toString());

      // Redirect to Shopify OAuth
      window.location.href = authUrl.toString();

    } catch (error) {
      console.error('Installation error:', error);
      toast({
        title: "Installation failed",
        description: "There was an error starting the installation process.",
        variant: "destructive",
      });
      setInstalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Shopify App Installation
                </h2>
                <p className="text-sm text-gray-500">Connect your store in 30 seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              One-Click Installation
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Transform Your Shopify
              </span>
              <br />
              <span className="text-gray-900">Returns Process</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Join 500+ Shopify merchants using AI-powered returns automation to increase exchanges, 
              reduce refunds, and boost customer satisfaction.
            </p>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 mb-12 text-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">85%</div>
                <div className="text-sm">Exchange Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">40%</div>
                <div className="text-sm">Revenue Recovery</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">90%</div>
                <div className="text-sm">Time Saved</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="text-center pb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-2xl w-fit mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">AI-Powered Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Smart product recommendations that turn 70% of returns into profitable exchanges
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="text-center pb-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl w-fit mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Deep insights into return patterns, customer behavior, and revenue impact
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="text-center pb-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-2xl w-fit mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  GDPR compliant with bank-level security and fraud protection
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Installation Card */}
          <Card className="max-w-2xl mx-auto shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-2xl w-fit mx-auto mb-4">
                <ExternalLink className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Install Returns Automation</CardTitle>
              <CardDescription className="text-base">
                Enter your Shopify store domain to begin the installation process
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Configuration Error */}
              {configError && (
                <div className="flex items-start gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">Configuration Error</div>
                    <div>{configError}</div>
                  </div>
                </div>
              )}
              
              {/* Installation Form */}
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
                    placeholder="your-store.myshopify.com"
                    className="h-12 text-base border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={installing}
                  />
                </div>
                
                <Button 
                  onClick={handleInstall}
                  disabled={installing || !clientId || !!configError}
                  className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {installing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Installing Returns Automation...
                    </>
                  ) : (
                    <>
                      Install App - Free 14-Day Trial
                      <ExternalLink className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Security & Permissions */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-xs text-gray-600 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Secure Installation:</span>
                    <span>Bank-level encryption, GDPR compliant</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Required Permissions:</span>
                      <div className="mt-1 text-gray-500">
                        • Read orders and customers (for return processing)<br/>
                        • Read products (for exchange recommendations)<br/>
                        • Process refunds and exchanges
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                By installing, you agree to our{' '}
                <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
                <br/>
                Cancel anytime during the 14-day trial period.
              </p>
            </CardContent>
          </Card>

          {/* Support */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Need help with installation or have questions?
            </p>
            <div className="flex items-center justify-center gap-6">
              <a 
                href="mailto:support@returnsautomation.com" 
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
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

export default ShopifyInstallation;
