import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { 
  Search, 
  Package, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Sparkles,
  Mail,
  Receipt,
  Clock,
  Shield,
  Heart
} from 'lucide-react';

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
    submitReturn,
    clearError,
    clearOrder
  } = useCustomerPortal();

  const returnReasonOptions = [
    { value: 'defective', label: 'Defective or damaged', icon: AlertCircle },
    { value: 'wrong_size', label: 'Wrong size', icon: Package },
    { value: 'wrong_item', label: 'Wrong item received', icon: Package },
    { value: 'not_described', label: 'Not as described', icon: AlertCircle },
    { value: 'changed_mind', label: 'Changed my mind', icon: Heart },
    { value: 'quality', label: 'Quality issues', icon: Shield },
    { value: 'other', label: 'Other reason', icon: RefreshCw }
  ];

  const steps = [
    { key: 'lookup', label: 'Find Order', icon: Search },
    { key: 'select', label: 'Select Items', icon: Package },
    { key: 'reason', label: 'Return Reason', icon: AlertCircle },
    { key: 'confirmation', label: 'Confirmation', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);
  const progressValue = ((currentStepIndex + 1) / steps.length) * 100;

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
        title: "Order found! ✨",
        description: `Welcome back! We found your order ${orderNumber.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Order not found",
        description: "Please double-check your order number and email address.",
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

  const handleReasonSelection = (itemId: string, reasonValue: string) => {
    setReturnReasons(prev => ({
      ...prev,
      [itemId]: reasonValue
    }));
  };

  const handleContinueToReason = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Select items to return",
        description: "Please choose at least one item from your order.",
        variant: "destructive",
      });
      return;
    }
    setStep('reason');
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
      await submitReturn({
        orderNumber,
        email,
        selectedItems,
        returnReasons
      });

      setStep('confirmation');
      
      toast({
        title: "Return submitted successfully! 🎉",
        description: "Your return is being processed. You'll receive updates via email.",
      });

    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "There was an error submitting your return request.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setStep('lookup');
    setSelectedItems([]);
    setReturnReasons({});
    clearError();
    clearOrder();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'lookup':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Find Your Order</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter your order details to begin a hassle-free return process
              </p>
            </div>

            <Card className="p-6 space-y-4 max-w-md mx-auto">
              {error && (
                <Alert variant="destructive" className="animate-scale-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label htmlFor="order-number" className="text-sm font-medium">
                  Order Number
                </label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="order-number"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    placeholder="ORD-2024-2020"
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleOrderLookup}
                disabled={loading || !orderNumber.trim() || !email.trim()}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    Find My Order
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </Card>
          </div>
        );

      case 'select':
        return order && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Select Items to Return</h2>
              <p className="text-muted-foreground">
                Choose the items you'd like to return from your order
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Order #{order.shopify_order_id}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <span>Total: ${order.total_amount.toFixed(2)}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-medium">
                    {selectedItems.length} selected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div 
                        key={item.id}
                        className={`group p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          selectedItems.includes(item.id)
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30'
                        }`}
                        onClick={() => handleItemSelection(item.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                              selectedItems.includes(item.id) 
                                ? 'bg-primary/10' 
                                : 'bg-muted'
                            }`}>
                              <Package className={`h-5 w-5 ${
                                selectedItems.includes(item.id) 
                                  ? 'text-primary' 
                                  : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-medium group-hover:text-primary transition-colors">
                                {item.product_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity} • ${item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {selectedItems.includes(item.id) && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-primary" />
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                Selected
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">No items found for this order</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between max-w-2xl mx-auto">
              <Button variant="outline" onClick={() => setStep('lookup')} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleContinueToReason}
                disabled={selectedItems.length === 0}
                className="flex items-center gap-2"
              >
                Continue ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'reason':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Why are you returning?</h2>
              <p className="text-muted-foreground">
                Help us understand the reason for each item return
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-6">
              {selectedItems.map(itemId => {
                const item = order?.items.find(i => i.id === itemId);
                if (!item) return null;
                
                return (
                  <Card key={itemId} className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.product_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} • Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      {returnReasonOptions.map((reason) => {
                        const Icon = reason.icon;
                        const isSelected = returnReasons[itemId] === reason.value;
                        
                        return (
                          <div
                            key={reason.value}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/30'
                            }`}
                            onClick={() => handleReasonSelection(itemId, reason.value)}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`h-4 w-4 ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <span className={`text-sm font-medium ${
                                isSelected ? 'text-primary' : 'text-foreground'
                              }`}>
                                {reason.label}
                              </span>
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between max-w-lg mx-auto">
              <Button variant="outline" onClick={() => setStep('select')} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleReturnSubmission}
                disabled={loading || selectedItems.some(id => !returnReasons[id])}
                className="flex items-center gap-2"
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
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-900">Return Submitted!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your return request has been received. We'll send you email updates as we process your return.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>What's next?</strong> You'll receive an email confirmation shortly with your return shipping label and tracking information.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {aiRecommendations.length > 0 && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Smart Recommendations
                  </CardTitle>
                  <CardDescription>
                    Based on your return, here are some alternatives you might love:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiRecommendations.map((suggestion, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium text-primary">{suggestion.suggestedProduct}</h4>
                            <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                          </div>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
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
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Your Return History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {returns.map((returnRequest) => (
                      <div key={returnRequest.id} className="p-4 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium">Return #{returnRequest.id.slice(0, 8)}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>Status: <Badge variant="outline">{returnRequest.status}</Badge></span>
                              <span>Items: {returnRequest.items.length}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
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
              <Button onClick={resetForm} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Return Request</h1>
            <p className="text-sm text-muted-foreground">
              Hassle-free returns with intelligent recommendations
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                {steps.map((stepItem, index) => {
                  const Icon = stepItem.icon;
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={stepItem.key} className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? isCurrent 
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{stepItem.label}</span>
                      </div>
                      {index < steps.length - 1 && (
                        <ArrowRight className={`h-4 w-4 transition-colors ${
                          index < currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          
          <div className="max-w-md mx-auto">
            <Progress value={progressValue} className="h-2" />
          </div>
        </div>

        {renderStepContent()}
      </div>
    </div>
  );
};

export default CustomerReturnsPortal;
