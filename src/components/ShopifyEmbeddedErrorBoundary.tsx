import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useAppBridge } from '@/components/AppBridgeProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface ShopifyEmbeddedErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ShopifyEmbeddedErrorFallback: React.FC<ShopifyEmbeddedErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const { isEmbedded } = useAppBridge();

  const handleContactSupport = () => {
    if (isEmbedded && window.parent) {
      // In embedded mode, open support in parent window
      window.parent.open('mailto:support@returnsautomation.com', '_blank');
    } else {
      // Standard mode
      window.open('mailto:support@returnsautomation.com', '_blank');
    }
  };

  const handleReload = () => {
    if (isEmbedded) {
      // In embedded mode, try to reload the iframe
      window.location.reload();
    } else {
      // Standard mode reload
      window.location.reload();
    }
  };

  return (
    <div className={`${isEmbedded ? 'h-screen p-4' : 'min-h-screen p-6'} flex items-center justify-center bg-background`}>
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isEmbedded ? 'App Error in Shopify' : 'Application Error'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isEmbedded 
              ? 'There was an error loading the Returns Automation app within Shopify.'
              : 'Something went wrong with the application.'
            }
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Error:</strong> {error.message}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            onClick={resetErrorBoundary}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <Button 
            onClick={handleReload}
            className="w-full"
            variant="outline"
          >
            Reload {isEmbedded ? 'App' : 'Page'}
          </Button>

          <Button 
            onClick={handleContactSupport}
            className="w-full"
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </div>

        {isEmbedded && (
          <div className="text-xs text-gray-500 text-center">
            <p>If this error persists, you can also access the app directly at:</p>
            <p className="font-mono text-blue-600 mt-1">
              {window.location.origin}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ShopifyEmbeddedErrorBoundaryProps {
  children: React.ReactNode;
}

export const ShopifyEmbeddedErrorBoundary: React.FC<ShopifyEmbeddedErrorBoundaryProps> = ({ 
  children 
}) => {
  const handleError = (error: Error, errorInfo: any) => {
    // Filter out Shopify platform errors that we can't control
    if (error.message?.includes('SendBeacon failed') || 
        error.stack?.includes('context-slice-metrics') ||
        error.stack?.includes('shopifycloud/web/assets')) {
      // Silently ignore Shopify platform errors
      return;
    }
    
    console.error('🚨 Shopify Embedded App Error:', error, errorInfo);
    
    // You can add additional error reporting here
    // For example, send to Sentry or other error tracking service
  };

  return (
    <ErrorBoundary
      FallbackComponent={ShopifyEmbeddedErrorFallback}
      onError={handleError}
      onReset={() => {
        // Optional: Clear any error state or reload data
        console.log('🔄 Error boundary reset');
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ShopifyEmbeddedErrorBoundary;