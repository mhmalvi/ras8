
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Search, Package, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  date: string;
}

const CustomerReturnsPortal = () => {
  const [step, setStep] = useState<'lookup' | 'select' | 'reason' | 'confirmation'>('lookup');
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const { toast } = useToast();

  const returnReasons = [
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

    setLoading(true);
    try {
      // Simulate API call to lookup order
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock order data - in real implementation, this would come from Shopify API
      const mockOrder: Order = {
        id: '1',
        orderNumber: orderNumber.toUpperCase(),
        items: [
          { id: '1', name: 'Premium T-Shirt - Blue', price: 29.99, quantity: 1 },
          { id: '2', name: 'Denim Jeans - Size 32', price: 79.99, quantity: 1 }
        ],
        total: 109.98,
        date: '2024-01-15'
      };

      setOrder(mockOrder);
      setStep('select');
      
      toast({
        title: "Order found!",
        description: `Order ${orderNumber.toUpperCase()} has been located.`,
      });
    } catch (error) {
      toast({
        title: "Order not found",
        description: "Please check your order number and email address.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleReturnSubmission = async () => {
    if (!returnReason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for your return.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate return submission and AI suggestion generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI suggestions
      setAiSuggestions([
        {
          id: '1',
          productName: 'Premium T-Shirt - Red',
          reason: 'Similar style in different color',
          confidence: 0.85
        },
        {
          id: '2',
          productName: 'Cotton Blend T-Shirt - Blue',
          reason: 'Same color, different material',
          confidence: 0.72
        }
      ]);

      setStep('confirmation');
      
      toast({
        title: "Return request submitted!",
        description: "We'll process your return within 1-2 business days.",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your return request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              <div>
                <label htmlFor="order-number" className="block text-sm font-medium mb-2">
                  Order Number
                </label>
                <Input
                  id="order-number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. #1001"
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
                  placeholder="your.email@example.com"
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
                <CardTitle>Order {order.orderNumber}</CardTitle>
                <CardDescription>
                  Placed on {new Date(order.date).toLocaleDateString()} • Total: ${order.total}
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
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-600">Qty: {item.quantity} • ${item.price}</p>
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
                <CardTitle>Return Reason</CardTitle>
                <CardDescription>
                  Please tell us why you're returning these items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {returnReasons.map((reason) => (
                  <div
                    key={reason}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      returnReason === reason
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setReturnReason(reason)}
                  >
                    <p className="text-sm">{reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button 
                onClick={handleReturnSubmission}
                disabled={!returnReason || loading}
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
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your return request has been submitted successfully! You'll receive an email confirmation shortly.
              </AlertDescription>
            </Alert>

            {aiSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Exchange Suggestions</CardTitle>
                  <CardDescription>
                    Based on your return, we recommend these alternatives:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{suggestion.productName}</h4>
                            <p className="text-sm text-gray-600">{suggestion.reason}</p>
                          </div>
                          <Badge variant="secondary">
                            {Math.round(suggestion.confidence * 100)}% match
                          </Badge>
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
