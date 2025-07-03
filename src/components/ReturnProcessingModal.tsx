
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Brain, FileText, Sparkles, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import CustomerCommunicationAI from './CustomerCommunicationAI';

interface ReturnProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnData: {
    id: string;
    customer_email: string;
    reason: string;
    total_amount: number;
    status: string;
    return_items?: Array<{
      product_name: string;
    }>;
  };
  onProcessingComplete: (result: any) => void;
}

interface AIRecommendation {
  suggestedProduct: string;
  confidence: number;
  reasoning: string;
  type?: string;
  expectedOutcome?: string;
  alternativeOptions?: string[];
}

const ReturnProcessingModal = ({ 
  isOpen, 
  onClose, 
  returnData, 
  onProcessingComplete 
}: ReturnProcessingModalProps) => {
  const { toast } = useToast();
  const [processingMethod, setProcessingMethod] = useState<'smart' | 'manual' | 'communication'>('smart');
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && processingMethod === 'smart') {
      generateAIRecommendation();
    }
  }, [isOpen, processingMethod]);

  const generateAIRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🤖 Generating AI recommendation for return:', returnData.id);
      
      const { data, error } = await supabase.functions.invoke('generate-exchange-recommendation', {
        body: {
          returnReason: returnData.reason,
          productName: returnData.return_items?.[0]?.product_name || 'Product',
          customerEmail: returnData.customer_email,
          orderValue: returnData.total_amount
        }
      });

      if (error) {
        console.error('❌ AI recommendation error:', error);
        throw error;
      }

      console.log('✅ AI recommendation received:', data);
      
      if (data?.success && data?.data) {
        setAiRecommendation({
          suggestedProduct: data.data.suggestedProduct,
          confidence: data.data.confidence,
          reasoning: data.data.reasoning,
          type: 'exchange',
          expectedOutcome: 'Improved customer satisfaction',
          alternativeOptions: ['Full refund', 'Store credit']
        });
        
        // Store AI suggestion in database
        await supabase
          .from('ai_suggestions')
          .insert({
            return_id: returnData.id,
            suggested_product_name: data.data.suggestedProduct,
            suggestion_type: 'exchange',
            confidence_score: data.data.confidence / 100,
            reasoning: data.data.reasoning,
            accepted: null
          });
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (error) {
      console.error('💥 Error generating AI recommendation:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate AI recommendation');
      
      // Set fallback recommendation
      setAiRecommendation({
        suggestedProduct: `Enhanced ${returnData.return_items?.[0]?.product_name || 'Product'}`,
        confidence: 75,
        reasoning: 'Fallback recommendation due to processing error',
        type: 'exchange',
        expectedOutcome: 'Standard processing',
        alternativeOptions: ['Full refund', 'Store credit']
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      
      // Update return status
      const { error } = await supabase
        .from('returns')
        .update({ 
          status: 'approved', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', returnData.id);

      if (error) throw error;

      // Mark AI suggestion as accepted if exists
      if (aiRecommendation) {
        await supabase
          .from('ai_suggestions')
          .update({ accepted: true })
          .eq('return_id', returnData.id);
      }

      toast({
        title: "Return Approved",
        description: "The return has been approved successfully.",
      });

      onProcessingComplete({
        returnId: returnData.id,
        action: 'approved',
        aiRecommendation,
        timestamp: new Date().toISOString()
      });
      
      onClose();
    } catch (error) {
      console.error('Error approving return:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve the return. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      
      // Update return status
      const { error } = await supabase
        .from('returns')
        .update({ 
          status: 'rejected', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', returnData.id);

      if (error) throw error;

      // Mark AI suggestion as rejected if exists
      if (aiRecommendation) {
        await supabase
          .from('ai_suggestions')
          .update({ accepted: false })
          .eq('return_id', returnData.id);
      }

      toast({
        title: "Return Rejected",
        description: "The return has been rejected.",
      });

      onProcessingComplete({
        returnId: returnData.id,
        action: 'rejected',
        timestamp: new Date().toISOString()
      });
      
      onClose();
    } catch (error) {
      console.error('Error rejecting return:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the return. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualProcessing = () => {
    onProcessingComplete({
      returnId: returnData.id,
      action: 'manual',
      timestamp: new Date().toISOString()
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Return Details - {returnData.id.slice(0, 8)}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Manage this return request with AI recommendations and customer communication
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer and Return Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {returnData.customer_email.split('@')[0]}</p>
                <p><strong>Email:</strong> {returnData.customer_email}</p>
                <p><strong>Order:</strong> #{returnData.id.slice(0, 8)}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold">Return Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Items:</strong> {returnData.return_items?.length || 1}</p>
                <p><strong>Reason:</strong> {returnData.reason}</p>
                <p><strong>Value:</strong> ${returnData.total_amount}</p>
                <p><strong>Status:</strong> <Badge variant="outline">{returnData.status}</Badge></p>
              </div>
            </div>
          </div>

          <Separator />

          <Tabs value={processingMethod} onValueChange={(value) => setProcessingMethod(value as 'smart' | 'manual' | 'communication')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="smart" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Smart Processing
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Customer Communication
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manual Processing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="smart" className="mt-6 space-y-6">
              {/* AI Recommendation Section */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">AI Recommendation</h3>
                </div>
                
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Generating AI recommendation...</span>
                  </div>
                )}

                {error && (
                  <div className="text-center py-4 text-red-600">
                    <p className="text-sm">Error: {error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={generateAIRecommendation}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {!loading && !error && aiRecommendation && (
                  <div className="space-y-4">
                    <p className="text-sm text-purple-700">
                      AI-generated recommendation based on return analysis
                    </p>
                    
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-900">
                            {aiRecommendation.suggestedProduct}
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            {aiRecommendation.reasoning}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={`text-purple-600 border-purple-200 ${
                              aiRecommendation.confidence >= 80 ? 'bg-green-50' : 
                              aiRecommendation.confidence >= 60 ? 'bg-yellow-50' : 'bg-red-50'
                            }`}
                          >
                            Confidence: {aiRecommendation.confidence}%
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {aiRecommendation.confidence >= 80 ? 'High Match' : 
                             aiRecommendation.confidence >= 60 ? 'Good Match' : 'Low Match'}
                          </p>
                        </div>
                      </div>
                      
                      {aiRecommendation.alternativeOptions && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Alternative options:</p>
                          <div className="flex flex-wrap gap-1">
                            {aiRecommendation.alternativeOptions.map((option, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleReject}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Approve
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="communication" className="mt-6">
              <CustomerCommunicationAI returnData={returnData} />
            </TabsContent>

            <TabsContent value="manual" className="mt-6">
              <div className="text-center py-8 space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">Manual Processing</h3>
                <p className="text-muted-foreground">
                  Process this return manually using traditional workflow
                </p>
                <Button onClick={handleManualProcessing}>
                  Continue with Manual Process
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnProcessingModal;
