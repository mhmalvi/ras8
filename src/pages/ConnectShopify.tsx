import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, ShoppingBag, Zap, BarChart3, Users, Shield, CheckCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const ConnectShopify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');

  const handleConnectShopify = () => {
    // Redirect to Shopify installation flow, preserving next parameter
    let installUrl = '/shopify/install';
    if (next) {
      installUrl += `?next=${encodeURIComponent(next)}`;
    }
    window.location.href = installUrl;
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
                  <span>Read-only access to sensitive data</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>GDPR compliant data handling</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Uninstall anytime from Shopify Admin</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="text-center">
          <CardHeader>
            <CardTitle>Ready to Get Started?</CardTitle>
            <CardDescription>
              Click below to securely connect your Shopify store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleConnectShopify}
              size="lg" 
              className="bg-[#96bf48] hover:bg-[#87a642] text-white"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Connect My Shopify Store
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              You'll be redirected to Shopify to authorize the H5 app installation
            </p>
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