
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle, AlertTriangle, Clock, Zap, TestTube } from "lucide-react";
import { useAIIntegration } from "@/hooks/useAIIntegration";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const AIIntegrationStatus = () => {
  const { status, loading, error, checkAIStatus, testAIFeature } = useAIIntegration();
  const { toast } = useToast();
  const [testing, setTesting] = useState<string | null>(null);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'green' : 'red';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  };

  const handleTestFeature = async (feature: string) => {
    setTesting(feature);
    try {
      const result = await testAIFeature(feature);
      
      if (result.success) {
        toast({
          title: "AI Feature Test Successful",
          description: `${feature} is working correctly!`,
        });
      } else {
        toast({
          title: "AI Feature Test Failed",
          description: result.error || `${feature} is not working properly`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test AI feature",
        variant: "destructive"
      });
    } finally {
      setTesting(null);
    }
  };

  const handleRefreshStatus = async () => {
    await checkAIStatus();
    toast({
      title: "Status Refreshed",
      description: "AI integration status has been updated",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 animate-pulse" />
            Checking AI Integration Status...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            AI Integration Status
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={loading}
          >
            Refresh Status
          </Button>
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
              {getStatusIcon(status.edgeFunctionsActive)}
              <span className="font-medium">AI Edge Functions</span>
            </div>
            <Badge 
              variant="outline"
              className={
                status.edgeFunctionsActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }
            >
              {status.edgeFunctionsActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {!status.edgeFunctionsActive && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                OpenAI API key may not be properly configured. AI features may not work correctly.
              </AlertDescription>
            </Alert>
          )}

          {status.edgeFunctionsActive && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                AI services are active and ready! OpenAI integration is working properly.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* AI Performance Metrics */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">AI Acceptance Rate</span>
              <span className="text-sm text-muted-foreground">{status.aiAcceptanceRate}%</span>
            </div>
            <Progress value={status.aiAcceptanceRate} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Processing Efficiency</span>
              <span className="text-sm text-muted-foreground">{status.processingEfficiency}%</span>
            </div>
            <Progress value={status.processingEfficiency} className="h-2" />
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
            <h4 className="font-medium text-sm">Available Features</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-blue-600" />
                <span>Customer Messages</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-blue-600" />
                <span>Predictive Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-blue-600" />
                <span>Advanced Insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test AI Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Test AI Features</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestFeature('recommendation')}
              disabled={testing === 'recommendation'}
              className="flex items-center gap-1"
            >
              <TestTube className="h-3 w-3" />
              {testing === 'recommendation' ? 'Testing...' : 'Test Recommendations'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestFeature('risk-analysis')}
              disabled={testing === 'risk-analysis'}
              className="flex items-center gap-1"
            >
              <TestTube className="h-3 w-3" />
              {testing === 'risk-analysis' ? 'Testing...' : 'Test Risk Analysis'}
            </Button>
          </div>
        </div>

        {/* Last Update */}
        {status.lastUpdate && (
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(status.lastUpdate).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIIntegrationStatus;
