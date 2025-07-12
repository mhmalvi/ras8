
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TestTube, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebhookTestDialogProps {
  webhook: {
    id: string;
    name: string;
    url: string;
    method: 'POST' | 'GET';
    merchantId: string;
  };
  onTest: (webhook: any) => void;
  isLoading: boolean;
}

const WebhookTestDialog = ({ webhook, onTest, isLoading }: WebhookTestDialogProps) => {
  const [customPayload, setCustomPayload] = useState('');
  const [useCustomPayload, setUseCustomPayload] = useState(false);
  const { toast } = useToast();

  const defaultPayload = {
    event: "webhook_test",
    version: "2.0",
    timestamp: new Date().toISOString(),
    source: "returns_automation_saas",
    merchantId: webhook.merchantId,
    tenantIsolated: true,
    
    // Test data for order webhook
    orderDetails: {
      id: "test-order-123",
      order_number: "#TEST1001",
      email: "test.customer@example.com",
      total_price: "149.99",
      currency: "USD",
      status: "paid",
      financial_status: "paid",
      fulfillment_status: "unfulfilled",
      created_at: new Date().toISOString(),
      tags: "test, webhook-validation",
      addresses: {
        shipping: {
          first_name: "John",
          last_name: "Doe",
          address1: "123 Test Street",
          city: "Test City",
          province: "TC",
          country: "United States",
          zip: "12345"
        }
      }
    },
    
    // Test data for customer
    customerDetails: {
      id: "test-customer-456",
      email: "test.customer@example.com",
      first_name: "John",
      last_name: "Doe",
      phone: "+1-555-0123",
      accepts_marketing: true
    },
    
    // Test data for line items
    itemDetails: [
      {
        id: "test-item-789",
        product_id: "test-product-101",
        variant_id: "test-variant-202",
        name: "Test Product - Blue Medium",
        quantity: 2,
        price: "74.99",
        sku: "TEST-BLUE-M",
        fulfillable_quantity: 2,
        fulfillment_status: null
      }
    ],
    
    // Test data for returns
    returnDetails: {
      id: "test-return-321",
      order_id: "test-order-123",
      status: "requested",
      reason: "Item doesn't fit as expected",
      refund_amount: "149.99",
      created_at: new Date().toISOString(),
      items: [
        {
          id: "test-return-item-654",
          product_id: "test-product-101",
          quantity: 2,
          reason: "Size issue",
          condition: "new"
        }
      ]
    },
    
    metadata: {
      webhook_id: `test_${Date.now()}`,
      source_topic: "webhook_test",
      merchant_id: webhook.merchantId,
      tenant_isolated: true,
      comprehensive: true,
      test_mode: true,
      scopes_covered: ["orders", "customers", "returns", "line_items"],
      payload_version: "2.0"
    }
  };

  const handleCopyPayload = () => {
    const payload = useCustomPayload && customPayload 
      ? customPayload 
      : JSON.stringify(defaultPayload, null, 2);
    
    navigator.clipboard.writeText(payload);
    toast({
      title: "Copied!",
      description: "Webhook payload copied to clipboard",
    });
  };

  const handleTest = () => {
    let finalPayload = defaultPayload;
    
    if (useCustomPayload && customPayload) {
      try {
        finalPayload = JSON.parse(customPayload);
        // Ensure merchantId is always present for security
        finalPayload.merchantId = webhook.merchantId;
        finalPayload.tenantIsolated = true;
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please check your custom payload format",
          variant: "destructive",
        });
        return;
      }
    }
    
    onTest({ ...webhook, testPayload: finalPayload });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={isLoading}>
          <TestTube className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Webhook: {webhook.name}
          </DialogTitle>
          <DialogDescription>
            Send a comprehensive test payload to your webhook endpoint
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Webhook Info */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">URL:</span>
                <code className="block text-xs bg-background p-1 rounded mt-1">
                  {webhook.url}
                </code>
              </div>
              <div>
                <span className="font-medium">Method:</span>
                <Badge variant={webhook.method === 'POST' ? 'default' : 'secondary'} className="ml-2">
                  {webhook.method}
                </Badge>
              </div>
            </div>
          </div>

          {/* Method Warning */}
          {webhook.method === 'GET' && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Method Mismatch Warning</p>
                <p className="text-yellow-700">
                  Your webhook is set to GET but this test sends POST with JSON payload. 
                  Consider changing your n8n webhook node to POST method.
                </p>
              </div>
            </div>
          )}

          {/* Payload Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Test Payload</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPayload}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Payload
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustom"
                checked={useCustomPayload}
                onChange={(e) => setUseCustomPayload(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="useCustom" className="text-sm">
                Use custom payload
              </Label>
            </div>
            
            {useCustomPayload ? (
              <Textarea
                placeholder="Enter your custom JSON payload..."
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                className="font-mono text-sm min-h-[200px]"
              />
            ) : (
              <div className="bg-background border rounded-lg p-3">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(defaultPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Test Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">What This Test Does:</p>
                <ul className="mt-1 space-y-1 text-blue-700">
                  <li>• Sends comprehensive test data covering orders, customers, returns</li>
                  <li>• Includes your merchant ID for proper tenant isolation</li>
                  <li>• Validates your n8n workflow receives and processes the payload</li>
                  <li>• Logs the test activity in your webhook activity feed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={handleTest}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookTestDialog;
