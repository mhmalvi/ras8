
import React from 'react';
import { Loader2, Package, Brain, Zap, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', text, className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin mr-2`} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const LoadingCard = ({ title = 'Loading...', description, icon }: LoadingCardProps) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-center flex-col space-y-4">
        {icon || <Loader2 className="h-8 w-8 animate-spin text-blue-600" />}
        <div className="text-center">
          <h3 className="font-medium text-slate-900">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="space-y-4">
    <div className="flex space-x-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

export const ReturnsLoadingState = () => (
  <LoadingCard 
    title="Loading Returns"
    description="Fetching your return requests..."
    icon={<Package className="h-8 w-8 animate-pulse text-blue-600" />}
  />
);

export const AILoadingState = () => (
  <LoadingCard 
    title="AI Processing"
    description="Generating intelligent recommendations..."
    icon={<Brain className="h-8 w-8 animate-pulse text-purple-600" />}
  />
);

export const BulkProcessingLoadingState = () => (
  <LoadingCard 
    title="Bulk Processing"
    description="Processing multiple returns with AI..."
    icon={<Zap className="h-8 w-8 animate-pulse text-green-600" />}
  />
);

export const AnalyticsLoadingState = () => (
  <LoadingCard 
    title="Loading Analytics"
    description="Calculating performance metrics..."
    icon={<BarChart3 className="h-8 w-8 animate-pulse text-orange-600" />}
  />
);

export const CustomerLoadingState = () => (
  <LoadingCard 
    title="Loading Customer Data"
    description="Fetching customer information..."
    icon={<Users className="h-8 w-8 animate-pulse text-teal-600" />}
  />
);

export const PageLoadingState = ({ message = 'Loading page...' }: { message?: string }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Please wait</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  </div>
);
