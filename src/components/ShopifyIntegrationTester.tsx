import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  ShoppingBag,
  Webhook,
  Key,
  Globe,
  Clock,
  TestTube
} from "lucide-react";

interface ValidationTest {
  name: string;
  description: string;
  status: 'pending' | 'success' | 'failed' | 'warning';
  details?: any;
  errorMessage?: string;
  duration?: number;
}

interface ValidationResult {
  success: boolean;
  overallStatus: 'success' | 'warning' | 'failed';
  shopDomain: string;
  testType: string;
  totalDuration: number;
  timestamp: string;
  tests: ValidationTest[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

interface OrderLookupResult {
  success: boolean;
  order?: any;
  error?: string;
  message?: string;
}

const ShopifyIntegrationTester = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [orderResult, setOrderResult] = useState<OrderLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const { toast } = useToast();

  const runValidation = async (testType: string = 'full') => {
    if (!shopDomain || !accessToken) {
      toast({
        title: "Missing Information",
        description: "Please provide shop domain and access token",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setValidationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('shopify-integration-validator', {
        body: {
          shopDomain: shopDomain.replace('.myshopify.com', '') + '.myshopify.com',
          accessToken,
          testType
        }
      });

      if (error) throw error;

      setValidationResult(data);
      
      toast({
        title: data.success ? "Validation Completed" : "Validation Failed", 
        description: `${data.summary.passed}/${data.summary.total} tests passed`,
        variant: data.success ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Failed to run validation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testOrderLookup = async () => {
    if (!shopDomain || !orderNumber || !customerEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide shop domain, order number, and customer email",
        variant: "destructive"
      });
      return;
    }

    setOrderLoading(true);
    setOrderResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('shopify-order-lookup', {
        body: {
          shopDomain: shopDomain.replace('.myshopify.com', '') + '.myshopify.com',
          orderNumber,
          customerEmail
        }
      });

      if (error) throw error;

      setOrderResult(data);
      
      toast({
        title: data.success ? "Order Found" : "Order Not Found",
        description: data.message || (data.success ? "Order lookup successful" : "Failed to find order"),
        variant: data.success ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Order lookup error:', error);
      toast({
        title: "Order Lookup Error",
        description: error instanceof Error ? error.message : "Failed to lookup order",
        variant: "destructive"
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      warning: 'secondary', 
      failed: 'destructive',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="ml-2">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Shopify Integration Tester
          </CardTitle>
          <CardDescription>
            Test and validate your Shopify integration including webhooks, order lookup, and HMAC verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="shopDomain">Shop Domain</Label>
              <Input
                id="shopDomain"
                placeholder="mystore.myshopify.com"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="shpat_..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="validation" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="validation">Integration Validation</TabsTrigger>
              <TabsTrigger value="order-lookup">Order Lookup Test</TabsTrigger>
            </TabsList>
            
            <TabsContent value="validation" className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => runValidation('full')} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  Full Validation
                </Button>
                <Button 
                  onClick={() => runValidation('hmac')} 
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  HMAC Only
                </Button>
                <Button 
                  onClick={() => runValidation('webhooks')} 
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Webhook className="h-4 w-4" />
                  Webhooks Only
                </Button>
                <Button 
                  onClick={() => runValidation('orders')} 
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Orders Only
                </Button>
              </div>

              {validationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Validation Results</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(validationResult.overallStatus)}
                        {getStatusBadge(validationResult.overallStatus)}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {validationResult.summary.passed}/{validationResult.summary.total} tests passed 
                      in {validationResult.totalDuration}ms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {validationResult.tests.map((test, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold flex items-center gap-2">
                              {getStatusIcon(test.status)}
                              {test.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              {test.duration && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {test.duration}ms
                                </span>
                              )}
                              {getStatusBadge(test.status)}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                          
                          {test.errorMessage && (
                            <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                              <p className="text-sm text-red-700">{test.errorMessage}</p>
                            </div>
                          )}
                          
                          {test.details && (
                            <div className="bg-gray-50 border rounded p-2">
                              <pre className="text-xs overflow-auto">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="order-lookup" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    placeholder="#1001 or 1001"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={testOrderLookup} 
                disabled={orderLoading}
                className="flex items-center gap-2"
              >
                {orderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                Test Order Lookup
              </Button>

              {orderResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {orderResult.success ? 
                        <CheckCircle className="h-5 w-5 text-green-600" /> : 
                        <XCircle className="h-5 w-5 text-red-600" />
                      }
                      Order Lookup Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderResult.success && orderResult.order ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Order Name</Label>
                            <p className="font-mono">{orderResult.order.name}</p>
                          </div>
                          <div>
                            <Label>Total Price</Label>
                            <p className="font-mono">{orderResult.order.totalPrice} {orderResult.order.currency}</p>
                          </div>
                          <div>
                            <Label>Financial Status</Label>
                            <Badge>{orderResult.order.financialStatus}</Badge>
                          </div>
                          <div>
                            <Label>Fulfillment Status</Label>
                            <Badge variant="secondary">{orderResult.order.fulfillmentStatus}</Badge>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label>Line Items ({orderResult.order.lineItems?.length || 0})</Label>
                          <div className="space-y-2 mt-2">
                            {orderResult.order.lineItems?.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center border rounded p-2">
                                <span>{item.name}</span>
                                <span className="font-mono">Qty: {item.quantity} × ${item.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-red-600 mb-2">{orderResult.error || 'Order not found'}</p>
                        <p className="text-sm text-muted-foreground">{orderResult.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyIntegrationTester;