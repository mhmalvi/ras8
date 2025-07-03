
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SmartReturnProcessor from './SmartReturnProcessor';
import { Brain, FileText } from 'lucide-react';

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

const ReturnProcessingModal = ({ 
  isOpen, 
  onClose, 
  returnData, 
  onProcessingComplete 
}: ReturnProcessingModalProps) => {
  const [processingMethod, setProcessingMethod] = useState<'smart' | 'manual'>('smart');

  const handleSmartProcessingComplete = (result: any) => {
    onProcessingComplete(result);
    onClose();
  };

  const handleManualProcessing = () => {
    // Manual processing workflow
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
            Process Return #{returnData.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <h3 className="font-medium">{returnData.customer_email}</h3>
              <p className="text-sm text-muted-foreground">
                {returnData.return_items?.[0]?.product_name || 'Product'} - ${returnData.total_amount}
              </p>
            </div>
            <Badge variant="outline">{returnData.status}</Badge>
          </div>

          <Tabs value={processingMethod} onValueChange={(value) => setProcessingMethod(value as 'smart' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="smart" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Smart Processing
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manual Processing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="smart" className="mt-6">
              <SmartReturnProcessor
                returnData={{
                  id: returnData.id,
                  customerEmail: returnData.customer_email,
                  productName: returnData.return_items?.[0]?.product_name || 'Product',
                  returnReason: returnData.reason,
                  orderValue: returnData.total_amount,
                  status: returnData.status
                }}
                onProcessingComplete={handleSmartProcessingComplete}
              />
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
