
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    period: string;
  };
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const MetricCard = ({ 
  title, 
  value, 
  description, 
  trend, 
  icon, 
  variant = 'default' 
}: MetricCardProps) => {
  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-slate-500';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'danger': return 'border-red-200 bg-red-50';
      default: return '';
    }
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", getVariantStyles())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-slate-400">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 mb-1">
          {value}
        </div>
        
        {trend && (
          <div className={cn("flex items-center space-x-1 text-xs mb-1", getTrendColor())}>
            {getTrendIcon()}
            <span>{trend.value}</span>
            <span className="text-slate-500">{trend.period}</span>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-slate-500">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
