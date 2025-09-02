import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, RefreshCw, AlertTriangle, Info, ShoppingBag } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const ReconnectShopify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const shop = searchParams.get('shop');
  const next = searchParams.get('next');

  const getReasonContent = () => {
    switch (reason) {
      case 'revoked':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          title: "Store Connection Revoked",
          description: "Your Shopify store connection has been revoked or the app was uninstalled. Please reconnect to continue using H5.",
          alertType: "warning" as const
        };
      case 'expired':
        return {
          icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
          title: "Session Expired",
          description: "Your store session has expired. Please reconnect to continue accessing your returns data.",
          alertType: "info" as const
        };
      case 'invalid':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          title: "Invalid Store Connection",
          description: "We detected an issue with your store connection. Please reconnect to ensure proper functionality.",
          alertType: "destructive" as const
        };
      case 'mismatch':
        return {
          icon: <Info className="h-5 w-5 text-blue-500" />,
          title: "Store Mismatch Detected",
          description: "The connected store doesn't match the current session. Please reconnect the correct store.",
          alertType: "info" as const
        };
      default:
        return {
          icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
          title: "Reconnect Your Store",
          description: "Please reconnect your Shopify store to continue using H5 Returns Automation.",
          alertType: "info" as const
        };
    }
  };

  const handleReconnect = () => {
    const baseUrl = shop ? `/shopify/install?shop=${encodeURIComponent(shop)}` : '/shopify/install';
    const redirectUrl = next ? `${baseUrl}&next=${encodeURIComponent(next)}` : baseUrl;
    window.location.href = redirectUrl;
  };

  const reasonContent = getReasonContent();

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-primary mr-3" />
            <RefreshCw className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">{reasonContent.title}</h1>
          <p className="text-muted-foreground mt-2">
            {reasonContent.description}
          </p>
        </div>

        <Alert variant={reasonContent.alertType}>
          {reasonContent.icon}
          <AlertDescription>
            <strong>Action Required:</strong> {reasonContent.description}
            {shop && (
              <span className="block mt-2 text-sm">
                Store to reconnect: <code className="bg-muted px-1 rounded">{shop}</code>
              </span>
            )}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2" />
              Reconnection Process
            </CardTitle>
            <CardDescription>
              Follow these steps to restore your store connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Click "Reconnect Store" below</p>
                  <p className="text-sm text-muted-foreground">
                    You'll be redirected to Shopify for secure authentication
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Authorize the H5 app</p>
                  <p className="text-sm text-muted-foreground">
                    Grant permission for H5 to access your store data
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Return to H5 Dashboard</p>
                  <p className="text-sm text-muted-foreground">
                    You'll be automatically redirected back to continue where you left off
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={handleReconnect}
            size="lg"
            className="bg-[#96bf48] hover:bg-[#87a642] text-white"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Reconnect My Shopify Store
          </Button>
          
          <p className="text-xs text-muted-foreground mt-3">
            This will open Shopify in a new window to complete the reconnection
          </p>

          {next && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                After reconnecting, you'll be returned to: 
                <code className="ml-1 bg-background px-1 rounded">{next}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ReconnectShopify;