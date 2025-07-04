
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { Search, Package, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const CustomerReturnsPortal = () => {
  const [step, setStep] = useState<'lookup' | 'select' | 'reason' | 'confirmation'>('lookup');
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const {
    loading,
    error,
    order,
    returns,
    aiRecommendations,
    lookupOrder,
    generateAIRecommendations,
    submitReturn,
    clearError
  } = useCustomerPortal();

  const returnReasonOptions = [
    'Defective/Damaged item',
    'Wrong size',
    'Wrong item received',
    'Not as described',
    'Changed my mind',
    'Quality issues',
    'Other'
  ];

  const handleOrderLookup = async () => {
    if (!orderNumber.trim() || !email.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both order number and email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      clearError();
      await lookupOrder(orderNumber, email);
      setStep('select');
      
      toast({
        title: "Order found!",
        description: `Order ${orderNumber.toUpperCase()} has been located.`,
      });
    } catch (error) {
      console.error('Order lookup error:', error);
      toast({
        title: "Order not found",
        description: "Please check your order number and email address. Make sure they match your original order.",
        variant: "destructive",
      });
    }
  };

  const handleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleReasonSelection = (itemId: string, reason: string) => {
    setReturnReasons(prev => ({
      ...prev,
      [itemId]: reason
    }));
  };

  const handleReturnSubmission = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to return.",
        variant: "destructive",
      });
      return;
    }

    const missingReasons = selectedItems.filter(itemId => !returnReasons[itemId]);
    if (missingReasons.length > 0) {
      toast({
        title: "Reason required",
        description: "Please select a reason for all selected items.",
        variant: "destructive",
      });
      return;
    }

    try {
      clearError();
      
      // Generate AI recommendations before submitting
      if (selectedItems.length > 0 && order) {
        const firstSelectedItem = order.items.find(item => selectedItems.includes(item.id));
        if (firstSelectedItem) {
          await generateAIRecommendations(
            returnReasons[firstSelectedItem.id],
            firstSelectedItem.product_name,
            email,
            order.total_amount
          );
        }
      }

      await submitReturn({
        orderNumber,
        email,
        selectedItems,
        returnReasons
      });

      setStep('confirmation');
      
      toast({
        title: "Return request submitted!",
        description: "We'll process your return within 1-2 business days.",
      });

    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "There was an error submitting your return request.",
        variant: "destructive",
      });
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'lookup':
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Order
              </CardTitle>
              <CardDescription>
                Enter your order details to start the return process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <label htmlFor="order-number" className="block text-sm font-medium mb-2">
                  Order Number
                </label>
                <Input
                  id="order-number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ORD-2024-1505"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  disabled={loading}
                />
              </div>
              <Button 
                onClick={handleOrderLookup}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    Find Order
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );

      case 'select':
        return order && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order #{order.shopify_order_id}</CardTitle>
                <CardDescription>
                  Placed on {new Date(order.created_at).toLocaleDateString()} • Total: ${order.total_amount.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm font-medium">Select items to return:</p>
                  {order.items.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedItems.includes(item.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleItemSelection(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="font-medium">{item.product_name}</h4>
                            <p className="text-sm text-gray-600">Qty: {item.quantity} • ${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                        {selectedItems.includes(item.id) && (
                          <Badge>Selected</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('lookup')}>
                Back
              </Button>
              <Button 
                onClick={() => setStep('reason')}
                disabled={selectedItems.length === 0}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'reason':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Return Reasons</CardTitle>
                <CardDescription>
                  Please select a reason for each item you're returning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedItems.map(itemId => {
                  const item = order?.items.find(i => i.id === itemId);
                  if (!item) return null;
                  
                  return (
                    <div key={itemId} className="space-y-2">
                      <h4 className="font-medium text-sm">{item.product_name}</h4>
                      <div className="space-y-2">
                        {returnReasonOptions.map((reason) => (
                          <div
                            key={reason}
                            className={`p-3 border rounded cursor-pointer transition-colors ${
                              returnReasons[itemId] === reason
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleReasonSelection(itemId, reason)}
                          >
                            <p className="text-sm">{reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button 
                onClick={handleReturnSubmission}
                disabled={loading || selectedItems.some(id => !returnReasons[id])}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Return
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your return request has been submitted successfully! You'll receive an email confirmation shortly.
              </AlertDescription>
            </Alert>

            {aiRecommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Exchange Suggestions</CardTitle>
                  <CardDescription>
                    Based on your return, we recommend these alternatives:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiRecommendations.map((suggestion, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{suggestion.suggestedProduct}</h4>
                            <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                          </div>
                          <Badge variant="secondary">
                            {Math.round(suggestion.confidence)}% match
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {returns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Return Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {returns.map((returnRequest) => (
                      <div key={returnRequest.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">Return #{returnRequest.id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-600">
                              Status: <Badge variant="outline">{returnRequest.status}</Badge>
                            </p>
                            <p className="text-sm text-gray-600">Items: {returnRequest.items.length}</p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(returnRequest.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button onClick={() => window.location.reload()}>
                Start New Return
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Return Request
          </h1>
          <p className="text-gray-600">
            Easy returns with AI-powered exchange suggestions
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {['Order Lookup', 'Select Items', 'Reason', 'Confirmation'].map((label, index) => (
              <React.Fragment key={label}>
                <div className={`px-3 py-1 rounded text-sm ${
                  ['lookup', 'select', 'reason', 'confirmation'].indexOf(step) >= index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {label}
                </div>
                {index < 3 && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {renderStepContent()}
      </div>
    </div>
  );
};

export default CustomerReturnsPortal;
