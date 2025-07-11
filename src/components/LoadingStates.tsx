
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ 
  size = "md", 
  text = "Loading...", 
  className 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <span className="text-sm text-slate-600">{text}</span>}
    </div>
  );
};

interface LoadingStateProps {
  message?: string;
  showSpinner?: boolean;
}

export const LoadingState = ({ 
  message = "Loading data...", 
  showSpinner = true 
}: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {showSpinner && <LoadingSpinner size="lg" />}
      <p className="text-slate-600 text-center">{message}</p>
    </div>
  );
};

export const TableLoadingState = () => {
  return (
    <div className="w-full py-8">
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/5"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardLoadingState = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
      </div>
    </div>
  );
};

export const BulkProcessingLoadingState = () => {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-2 bg-slate-200 rounded w-full"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-slate-200 rounded w-16"></div>
            <div className="h-3 bg-slate-200 rounded w-16"></div>
            <div className="h-3 bg-slate-200 rounded w-16"></div>
            <div className="h-3 bg-slate-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomerLoadingState = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border rounded-lg">
        <div className="p-6 animate-pulse">
          <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-6"></div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
            </div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
