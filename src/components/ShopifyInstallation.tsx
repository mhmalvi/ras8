
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Shield, Zap, BarChart3 } from 'lucide-react';

const ShopifyInstallation = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [installing, setInstalling] = useState(false);
  const { toast } = useToast();

  // Shopify App configuration - use proper client ID
  const SHOPIFY_CLIENT_ID = 'your-shopify-client-id'; // This should be set via environment
  const SCOPES = 'read_orders,write_orders,read_customers,read_products';
  const CALLBACK_URL = `${window.location.origin}/functions/v1/shopify-oauth-callback`;

  const handleInstall = async () => {
    if (!shopDomain.trim()) {
      toast({
        title: "Shop domain required",
        description: "Please enter your Shopify shop domain.",
        variant: "destructive",
      });
      return;
    }

    // Clean up shop domain
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!cleanDomain.includes('.myshopify.com') && !cleanDomain.includes('.')) {
      const correctedDomain = `${cleanDomain}.myshopify.com`;
      setShopDomain(correctedDomain);
    }

    setInstalling(true);

    try {
      // Generate state parameter for security
      const state = crypto.randomUUID();
      sessionStorage.setItem('shopify_oauth_state', state);

      // Build Shopify OAuth URL with proper parameters
      const authUrl = new URL(`https://${cleanDomain}/admin/oauth/authorize`);
      authUrl.searchParams.set('client_id', SHOPIFY_CLIENT_ID);
      authUrl.searchParams.set('scope', SCOPES);
      authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('grant_options[]', 'per-user'); // For proper app embedding

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Returns Automation for Shopify
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your returns process with AI-powered automation. 
            Increase exchanges, reduce refunds, and delight your customers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Zap className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>AI-Powered Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Smart product recommendations that turn returns into exchanges
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Detailed insights into return patterns and revenue impact
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Secure & Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                GDPR compliant with enterprise-grade security
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Install Returns Automation</CardTitle>
            <CardDescription>
              Enter your Shopify store domain to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="shop-domain" className="block text-sm font-medium text-gray-700 mb-2">
                Shop Domain
              </label>
              <Input
                id="shop-domain"
                type="text"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="your-store.myshopify.com"
                className="w-full"
                disabled={installing}
              />
            </div>
            
            <Button 
              onClick={handleInstall}
              disabled={installing}
              className="w-full"
              size="lg"
            >
              {installing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Installing...
                </>
              ) : (
                <>
                  Install App
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center mt-4">
              <p>By installing, you agree to our Terms of Service and Privacy Policy.</p>
              <p className="mt-1">
                <strong>Permissions:</strong> Read orders, customers, and products to provide return automation.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@returnsautomation.com" className="text-blue-600 hover:underline">
              support@returnsautomation.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopifyInstallation;
