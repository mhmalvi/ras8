
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Store, Shield, Zap } from 'lucide-react';

export const ShopifyInstallation = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstallation = async () => {
    if (!shopDomain.trim()) {
      setError('Please enter your shop domain');
      return;
    }

    setIsInstalling(true);
    setError(null);

    try {
      // Clean up the shop domain
      let cleanDomain = shopDomain.trim().toLowerCase();
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
      cleanDomain = cleanDomain.replace(/\/$/, '');
      
      if (!cleanDomain.endsWith('.myshopify.com')) {
        if (cleanDomain.includes('.')) {
          // Custom domain, add .myshopify.com equivalent
          const shopname = cleanDomain.split('.')[0];
          cleanDomain = `${shopname}.myshopify.com`;
        } else {
          cleanDomain = `${cleanDomain}.myshopify.com`;
        }
      }

      // Build OAuth URL
      const clientId = '2da34c83e89f6645ad1fb2028c7532dd';
      const redirectUri = `${window.location.origin}/api/auth/shopify/callback`;
      const scopes = 'read_orders,write_orders,read_products,read_customers';
      const state = encodeURIComponent(window.location.origin);
      
      const oauthUrl = `https://${cleanDomain}/admin/oauth/authorize?` +
        `client_id=${clientId}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;

      console.log('Redirecting to Shopify OAuth:', oauthUrl);
      
      // Redirect to Shopify OAuth
      window.location.href = oauthUrl;

    } catch (err) {
      console.error('Installation error:', err);
      setError(err instanceof Error ? err.message : 'Installation failed');
      setIsInstalling(false);
    }
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShopDomain(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Store className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Install Returns Automation</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Connect your Shopify store to start automating returns with AI-powered recommendations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Secure Installation</span>
          </CardTitle>
          <CardDescription>
            Enter your Shopify store domain to begin the secure OAuth installation process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-domain">Shop Domain</Label>
            <Input
              id="shop-domain"
              type="text"
              placeholder="your-store.myshopify.com"
              value={shopDomain}
              onChange={handleDomainChange}
              disabled={isInstalling}
            />
            <p className="text-sm text-gray-500">
              Enter your shop name or full domain (e.g., "mystore" or "mystore.myshopify.com")
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleInstallation}
            disabled={isInstalling || !shopDomain.trim()}
            className="w-full"
            size="lg"
          >
            {isInstalling ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Shopify...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Install on Shopify
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
            <div>
              <p className="font-medium">Shopify Authorization</p>
              <p className="text-sm text-gray-600">You'll be redirected to Shopify to authorize the app</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
            <div>
              <p className="font-medium">Permission Review</p>
              <p className="text-sm text-gray-600">Review and approve the requested permissions</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
            <div>
              <p className="font-medium">Installation Complete</p>
              <p className="text-sm text-gray-600">Start managing returns with AI automation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        <p>This app requires permissions to read orders, products, and customers to provide return automation services.</p>
      </div>
    </div>
  );
};
