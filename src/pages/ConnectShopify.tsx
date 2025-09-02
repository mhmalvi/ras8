import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, ShoppingBag, Zap, BarChart3, Users, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { validateShopDomain, ensureShopifyDomain } from "@/utils/shopifyInstallation";

const ConnectShopify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnectShopify = async () => {
    if (!shopDomain.trim()) {
      setError('Please enter your Shopify store domain');
      return;
    }

    setError('');
    setIsConnecting(true);
    
    try {
      // Validate and format the shop domain
      const formattedDomain = ensureShopifyDomain(shopDomain.trim());
      
      if (!validateShopDomain(formattedDomain)) {
        setError('Please enter a valid Shopify store domain (e.g., your-store.myshopify.com)');
        setIsConnecting(false);
        return;
      }

      // Build OAuth URL to start the Shopify connection process
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      let oauthUrl = `${appUrl}/auth/start?shop=${encodeURIComponent(formattedDomain)}`;
      
      if (next) {
        oauthUrl += `&next=${encodeURIComponent(next)}`;
      }
      
      console.log('🚀 Initiating Shopify OAuth for standalone user:', { shop: formattedDomain, next });
      
      // Redirect to OAuth flow
      window.location.href = oauthUrl;
      
    } catch (err) {
      console.error('Error initiating Shopify connection:', err);
      setError('Failed to initiate connection. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleShopDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShopDomain(value);
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnectShopify();
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-primary mr-3" />
            <span className="text-3xl font-bold">Connect Your Shopify Store</span>
          </div>
          <p className="text-muted-foreground text-lg">
            Connect your Shopify store to unlock the full power of H5 Returns Automation
          </p>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Shopify Connection Required:</strong> To use H5's returns automation features, 
            you need to connect your Shopify store. This allows us to access your orders, 
            customers, and products to provide intelligent returns processing.
          </AlertDescription>
        </Alert>

        {/* Shop Domain Input Section */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Connect Your Store</CardTitle>
            <CardDescription>
              Enter your Shopify store domain to begin the secure connection process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2 max-w-md mx-auto">
              <Label htmlFor="shopDomain">Your Shopify Store Domain</Label>
              <Input
                id="shopDomain"
                type="text"
                placeholder="your-store.myshopify.com"
                value={shopDomain}
                onChange={handleShopDomainChange}
                onKeyPress={handleKeyPress}
                disabled={isConnecting}
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">
                Enter your store's domain (e.g., "my-store" or "my-store.myshopify.com")
              </p>
            </div>
            
            <Button 
              onClick={handleConnectShopify}
              size="lg" 
              disabled={isConnecting || !shopDomain.trim()}
              className="bg-[#96bf48] hover:bg-[#87a642] text-white disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Connect & Authorize My Store
                </>
              )}
            </Button>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <p className="text-blue-800">
                🔒 You'll be securely redirected to Shopify to authorize H5's access to your store data.
                This allows us to sync orders, products, and customers for returns automation.
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground">
              By connecting, you grant H5 permission to read orders, products, and customer data
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary" />
                What You'll Unlock
              </CardTitle>
              <CardDescription>
                Premium features available after connecting your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Automated return request processing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Real-time order and product sync</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Customer communication automation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Advanced analytics and reporting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>AI-powered return insights</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-500" />
                Safe & Secure
              </CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>OAuth 2.0 secure authentication</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Encrypted data transmission</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Limited scope permissions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>GDPR compliant data handling</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Revoke access anytime from Shopify Admin</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Process Steps */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              The connection process is simple and secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                  1
                </div>
                <h4 className="font-medium mb-1">Enter Store Domain</h4>
                <p className="text-sm text-muted-foreground">
                  Provide your Shopify store's domain
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                  2
                </div>
                <h4 className="font-medium mb-1">Authorize on Shopify</h4>
                <p className="text-sm text-muted-foreground">
                  Grant H5 permission to access your store data
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-medium">
                  3
                </div>
                <h4 className="font-medium mb-1">Start Automating</h4>
                <p className="text-sm text-muted-foreground">
                  Return to H5 and begin using returns automation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center">
            <BarChart3 className="h-6 w-6 mb-2 text-primary" />
            <span>Real-time Analytics</span>
          </div>
          <div className="flex flex-col items-center">
            <Users className="h-6 w-6 mb-2 text-primary" />
            <span>Customer Insights</span>
          </div>
          <div className="flex flex-col items-center">
            <Zap className="h-6 w-6 mb-2 text-primary" />
            <span>Automated Workflows</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ConnectShopify;