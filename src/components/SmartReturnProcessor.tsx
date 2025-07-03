
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, CheckCircle, AlertTriangle, MessageSquare, Zap } from "lucide-react";
import { enhancedAIService } from '@/services/enhancedAIService';
import { useToast } from "@/hooks/use-toast";

interface ReturnData {
  id: string;
  customerEmail: string;
  productName: string;
  returnReason: string;
  orderValue: number;
  status: string;
}

interface SmartReturnProcessorProps {
  returnData: ReturnData;
  onProcessingComplete: (result: any) => void;
}

const SmartReturnProcessor = ({ returnData, onProcessingComplete }: SmartReturnProcessorProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [customerMessage, setCustomerMessage] = useState('');
  const [step, setStep] = useState<'analyzing' | 'reviewing' | 'complete'>('analyzing');

  useEffect(() => {
    if (returnData) {
      processReturn();
    }
  }, [returnData]);

  const processReturn = async () => {
    setProcessing(true);
    try {
      console.log('🔄 Starting smart return processing for:', returnData.id);

      // Step 1: Generate AI recommendation
      setStep('analyzing');
      const aiRecommendation = await enhancedAIService.generateAdvancedRecommendation({
        returnId: returnData.id,
        productName: returnData.productName,
        returnReason: returnData.returnReason,
        customerEmail: returnData.customerEmail,
        orderValue: returnData.orderValue
      });

      setRecommendation(aiRecommendation);

      // Step 2: Analyze risk
      const riskAssessment = await enhancedAIService.analyzeReturnRisk({
        returnId: returnData.id,
        productName: returnData.productName,
        returnReason: returnData.returnReason,
        customerEmail: returnData.customerEmail,
        orderValue: returnData.orderValue
      });

      setRiskAnalysis(riskAssessment);

      // Step 3: Generate customer message
      const message = await enhancedAIService.generateCustomerMessage(
        {
          returnId: returnData.id,
          productName: returnData.productName,
          returnReason: returnData.returnReason,
          customerEmail: returnData.customerEmail,
          orderValue: returnData.orderValue
        },
        aiRecommendation
      );

      setCustomerMessage(message);
      setStep('reviewing');

      toast({
        title: "AI Analysis Complete",
        description: "Smart return processing has been completed successfully.",
      });
    } catch (error) {
      console.error('💥 Smart processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to complete smart return processing.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const approveRecommendation = async () => {
    try {
      const result = {
        returnId: returnData.id,
        recommendation,
        riskAnalysis,
        customerMessage,
        action: 'approved',
        timestamp: new Date().toISOString()
      };

      onProcessingComplete(result);
      setStep('complete');

      toast({
        title: "Recommendation Approved",
        description: "The AI recommendation has been applied successfully.",
      });
    } catch (error) {
      console.error('Error approving recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to approve recommendation.",
        variant: "destructive",
      });
    }
  };

  const rejectRecommendation = () => {
    setStep('complete');
    onProcessingComplete({
      returnId: returnData.id,
      action: 'rejected',
      timestamp: new Date().toISOString()
    });
  };

  if (processing && step === 'analyzing') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Brain className="h-12 w-12 mx-auto text-blue-500 animate-pulse" />
            <h3 className="text-lg font-semibold">AI Processing Return</h3>
            <p className="text-muted-foreground">
              Analyzing return data and generating intelligent recommendations...
            </p>
            <Progress value={66} className="w-full" />
            <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
              <span>✓ Return validated</span>
              <span>⏳ Generating recommendations</span>
              <span>⏳ Risk assessment</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-semibold">Processing Complete</h3>
            <p className="text-muted-foreground">
              Smart return processing has been completed successfully.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Return Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart Return Processing
          </CardTitle>
          <CardDescription>
            AI-powered analysis and recommendations for return #{returnData.id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Customer:</span> {returnData.customerEmail}
            </div>
            <div>
              <span className="font-medium">Product:</span> {returnData.productName}
            </div>
            <div>
              <span className="font-medium">Reason:</span> {returnData.returnReason}
            </div>
            <div>
              <span className="font-medium">Order Value:</span> ${returnData.orderValue}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      {recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Recommendation
              </span>
              <Badge variant="outline">
                {recommendation.confidence}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended Action:</strong> {recommendation.type}
                {recommendation.suggestedProduct && (
                  <span> - {recommendation.suggestedProduct}</span>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">AI Reasoning:</h4>
                <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Expected Outcome:</h4>
                <p className="text-sm text-muted-foreground">{recommendation.expectedOutcome}</p>
              </div>

              {recommendation.alternativeOptions?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Alternative Options:</h4>
                  <div className="space-y-1">
                    {recommendation.alternativeOptions.map((option: string, index: number) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Customer Retention Score:</span>
                  <Progress value={recommendation.customerRetentionScore} className="w-20 h-2" />
                  <span className="text-sm text-muted-foreground">
                    {recommendation.customerRetentionScore}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Analysis */}
      {riskAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Risk Level:</span>
              <Badge variant={
                riskAnalysis.riskLevel === 'high' ? 'destructive' : 
                riskAnalysis.riskLevel === 'medium' ? 'secondary' : 'default'
              }>
                {riskAnalysis.riskLevel}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>Fraud Probability:</span>
              <span className="text-sm">
                {(riskAnalysis.fraudProbability * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Customer Satisfaction Score:</span>
              <span className="text-sm">{riskAnalysis.customerSatisfactionScore}%</span>
            </div>

            <div>
              <h4 className="font-medium mb-1">Risk Analysis:</h4>
              <p className="text-sm text-muted-foreground">{riskAnalysis.reasoning}</p>
            </div>

            <Alert variant={riskAnalysis.riskLevel === 'high' ? 'destructive' : 'default'}>
              <AlertDescription>
                <strong>Recommended Action:</strong> {riskAnalysis.recommendedAction}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Customer Message */}
      {customerMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI-Generated Customer Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              className="min-h-24"
              placeholder="AI-generated customer message..."
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {recommendation && riskAnalysis && (
        <div className="flex justify-center gap-4">
          <Button onClick={approveRecommendation} className="min-w-32">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve AI Recommendation
          </Button>
          <Button variant="outline" onClick={rejectRecommendation} className="min-w-32">
            Override & Manual Process
          </Button>
        </div>
      )}
    </div>
  );
};

export default SmartReturnProcessor;
