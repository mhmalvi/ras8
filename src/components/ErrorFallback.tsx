
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorFallbackProps {
  message?: string;
  error?: Error;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export const ErrorFallback = ({ 
  message = "Something went wrong", 
  error,
  onRetry,
  showHomeButton = true 
}: ErrorFallbackProps) => {
  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{message}</h2>
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-left">
                <strong>Error:</strong> {error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleRefresh} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          {showHomeButton && (
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
