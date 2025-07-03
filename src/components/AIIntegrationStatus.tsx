
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, CheckCircle, AlertTriangle, Clock, Zap } from "lucide-react";

interface AIStatusProps {
  aiAcceptanceRate?: number;
  processingEfficiency?: number;
  edgeFunctionsStatus?: 'active' | 'needs_config' | 'error';
}

const AIIntegrationStatus = ({ 
  aiAcceptanceRate = 0, 
  processingEfficiency = 0,
  edgeFunctionsStatus = 'needs_config'
}: AIStatusProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'needs_config': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'needs_config': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          AI Integration Status
        </CardTitle>
        <CardDescription>
          Current status of AI-powered features and services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Services Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(edgeFunctionsStatus)}
              <span className="font-medium">AI Edge Functions</span>
            </div>
            <Badge 
              variant="outline"
              className={
                edgeFunctionsStatus === 'active' ? "bg-green-50 text-green-700" :
                edgeFunctionsStatus === 'needs_config' ? "bg-yellow-50 text-yellow-700" :
                "bg-red-50 text-red-700"
              }
            >
              {edgeFunctionsStatus === 'active' ? 'Active' :
               edgeFunctionsStatus === 'needs_config' ? 'Needs Config' : 'Error'}
            </Badge>
          </div>

          {edgeFunctionsStatus === 'needs_config' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                OpenAI API key may not be configured. Check Edge Functions settings to enable AI features.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* AI Performance Metrics */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">AI Acceptance Rate</span>
              <span className="text-sm text-muted-foreground">{aiAcceptanceRate}%</span>
            </div>
            <Progress value={aiAcceptanceRate} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Processing Efficiency</span>
              <span className="text-sm text-muted-foreground">{processingEfficiency}%</span>
            </div>
            <Progress value={processingEfficiency} className="h-2" />
          </div>
        </div>

        {/* Feature Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Active Features</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Smart Recommendations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Risk Analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Performance Tracking</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Pending Features</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-yellow-600" />
                <span>Predictive Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-yellow-600" />
                <span>Auto Communications</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-yellow-600" />
                <span>Fraud Detection</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIIntegrationStatus;
