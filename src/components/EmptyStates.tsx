import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Users, 
  RefreshCw, 
  ShoppingCart, 
  BarChart3, 
  Lightbulb,
  AlertCircle,
  Database,
  ExternalLink
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'info';
}

export function EmptyState({ title, description, action, icon, variant = 'default' }: EmptyStateProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-orange-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card className={`w-full ${getVariantStyles()}`}>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {icon && (
          <div className={`mb-4 ${getIconColor()}`}>
            {icon}
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">{description}</p>
        {action && (
          <Button onClick={action.onClick} variant="outline" className="gap-2">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Specific empty states for different data types
export function NoProductsEmptyState() {
  return (
    <EmptyState
      title="No products found"
      description="Connect your Shopify store to start seeing your product data and return analytics."
      action={{
        label: "Connect Shopify",
        onClick: () => window.location.href = "/shopify/install"
      }}
      icon={<Package className="h-12 w-12" />}
      variant="info"
    />
  );
}

export function NoCustomersEmptyState() {
  return (
    <EmptyState
      title="No customers yet"
      description="Your customer data will appear here once you connect your Shopify store and receive orders."
      icon={<Users className="h-12 w-12" />}
      variant="info"
    />
  );
}

export function NoReturnsEmptyState() {
  return (
    <EmptyState
      title="No returns yet"
      description="Return requests will appear here as customers submit them through your store."
      action={{
        label: "Learn about returns",
        onClick: () => window.open("https://help.shopify.com/en/manual/orders/return-and-exchange", "_blank")
      }}
      icon={<RefreshCw className="h-12 w-12" />}
    />
  );
}

export function NoOrdersEmptyState() {
  return (
    <EmptyState
      title="No orders found"
      description="Orders from your connected Shopify store will appear here once customers make purchases."
      icon={<ShoppingCart className="h-12 w-12" />}
      variant="info"
    />
  );
}

export function NoAnalyticsEmptyState() {
  return (
    <EmptyState
      title="No analytics data"
      description="Analytics insights will be generated once you have customer interactions and return data."
      icon={<BarChart3 className="h-12 w-12" />}
    />
  );
}

export function NoAIInsightsEmptyState() {
  return (
    <EmptyState
      title="No AI insights available"
      description="AI-powered insights will be generated as you collect more return and customer data."
      icon={<Lightbulb className="h-12 w-12" />}
    />
  );
}

export function NoDataEmptyState({ resourceType }: { resourceType: string }) {
  return (
    <EmptyState
      title={`No ${resourceType} data`}
      description={`Your ${resourceType} information will appear here once your store is connected and active.`}
      icon={<Database className="h-12 w-12" />}
    />
  );
}

export function ShopifyNotConnectedEmptyState() {
  return (
    <EmptyState
      title="Shopify store not connected"
      description="Connect your Shopify store to start tracking returns, analyzing customer data, and getting AI-powered insights."
      action={{
        label: "Connect Shopify Store",
        onClick: () => window.location.href = "/shopify/install"
      }}
      icon={<ExternalLink className="h-12 w-12" />}
      variant="warning"
    />
  );
}

export function ErrorEmptyState({ 
  title = "Something went wrong", 
  description = "We encountered an error loading your data. Please try refreshing the page.",
  onRetry 
}: { 
  title?: string; 
  description?: string; 
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={onRetry ? {
        label: "Try again",
        onClick: onRetry
      } : undefined}
      icon={<AlertCircle className="h-12 w-12" />}
      variant="warning"
    />
  );
}

// Loading skeleton component for data states
export function DataLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

// Component to show when user doesn't have proper merchant context
export function NoMerchantContextEmptyState() {
  return (
    <EmptyState
      title="No merchant context"
      description="You need to be associated with a merchant account to view this data. Please contact support if you believe this is an error."
      action={{
        label: "Contact Support",
        onClick: () => window.open("mailto:support@yourapp.com", "_blank")
      }}
      icon={<AlertCircle className="h-12 w-12" />}
      variant="warning"
    />
  );
}