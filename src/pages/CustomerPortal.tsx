import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Package, Sparkles, ArrowRight, ArrowLeft, Mail, Hash, Loader2, AlertTriangle, Info, RefreshCw, History } from "lucide-react";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";
import { useToast } from "@/hooks/use-toast";
import ReturnManagement from "@/components/ReturnManagement";

const CustomerPortal = () => {
  const { toast } = useToast();
  const { 
    loading, 
    error, 
    order, 
    aiRecommendations, 
    lookupOrder, 
    generateAIRecommendations, 
    submitReturn,
    clearError 
  } = useCustomerPortal();

  const [currentStep, setCurrentStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [submittedReturnId, setSubmittedReturnId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('new-return');

  const steps = [
    { number: 1, title: "Order Lookup", description: "Find your order" },
    { number: 2, title: "Select Items", description: "Choose items to return" },
    { number: 3, title: "Return Reason", description: "Tell us why" },
    { number: 4, title: "AI Recommendations", description: "Smart suggestions" },
    { number: 5, title: "Confirmation", description: "All done!" }
  ];

  // Clear error when user navigates between steps
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [currentStep]);

  const handleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleReasonChange = (itemId: string, reason: string) => {
    setReturnReasons(prev => ({ ...prev, [itemId]: reason }));
  };

  const getProgressPercentage = () => {
    return (currentStep / steps.length) * 100;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return orderNumber.trim() && email.trim() && !loading;
      case 2:
        return selectedItems.length > 0;
      case 3:
        return selectedItems.every(id => returnReasons[id]);
      default:
        return true;
    }
  };

  const handleOrderLookup = async () => {
    try {
      clearError();
      await lookupOrder(orderNumber.trim(), email.trim());
      setCurrentStep(2);
      toast({
        title: "Order Found!",
        description: "Your order has been located successfully."
      });
    } catch (error) {
      console.error('Order lookup failed:', error);
      toast({
        title: "Order Not Found",
        description: error instanceof Error ? error.message : "Please check your order number and email address.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!order || selectedItems.length === 0) {
      setCurrentStep(4);
      return;
    }

    const firstSelectedItem = order.items.find(item => selectedItems.includes(item.id));
    const returnReason = returnReasons[selectedItems[0]];

    if (firstSelectedItem && returnReason) {
      try {
        await generateAIRecommendations(
          returnReason,
          firstSelectedItem.product_name,
          order.customer_email,
          order.total_amount
        );
      } catch (error) {
        console.warn('AI recommendations failed, proceeding anyway:', error);
      }
    }
    setCurrentStep(4);
  };

  const handleSubmitReturn = async () => {
    try {
      const result = await submitReturn({
        orderNumber: orderNumber.trim(),
        email: email.trim(),
        selectedItems,
        returnReasons
      });
      setSubmittedReturnId(result.returnId);
      setCurrentStep(5);
      toast({
        title: "Return Submitted!",
        description: "Your return request has been processed successfully."
      });
    } catch (error) {
      console.error('Return submission failed:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit return request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const nextStep = () => {
    if (!canProceed()) return;

    if (currentStep === 1) {
      handleOrderLookup();
    } else if (currentStep === 3) {
      handleGenerateRecommendations();
    } else if (currentStep === 4) {
      handleSubmitReturn();
    } else if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      clearError();
    }
  };

  const resetPortal = () => {
    setCurrentStep(1);
    setOrderNumber('');
    setEmail('');
    setSelectedItems([]);
    setReturnReasons({});
    setSubmittedReturnId(null);
    clearError();
    setActiveTab('new-return');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Returns Automation</h1>
                <p className="text-sm text-slate-500">Easy Returns Portal</p>
              </div>
            </div>
            {(currentStep > 1 && currentStep < 5) || activeTab === 'manage-returns' ? (
              <Button variant="outline" size="sm" onClick={resetPortal}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="new-return" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>New Return</span>
            </TabsTrigger>
            <TabsTrigger value="manage-returns" className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>My Returns</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-return">
            {/* Progress Bar */}
            <div className="bg-white border-b border-slate-100 px-4 py-4 rounded-t-lg mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {steps[currentStep - 1].title}
                </h2>
                <span className="text-sm text-slate-500">
                  Step {currentStep} of {steps.length}
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              <div className="flex justify-between mt-2">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep > step.number 
                        ? 'bg-green-500 text-white' 
                        : currentStep === step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span className="text-xs text-slate-500 mt-1 hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Error Display */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step Content */}
            {currentStep === 1 && (
              <Card className="max-w-lg mx-auto">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Hash className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle>Find Your Order</CardTitle>
                  <CardDescription>
                    Enter your order number and email to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Use real order data from your database. Try order numbers like "ORD-2024-3008" with email "sarah.johnson@email.com"
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number</Label>
                    <Input
                      id="orderNumber"
                      placeholder="e.g., ORD-2024-3008"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={nextStep} 
                    disabled={!canProceed()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Finding Order...
                      </>
                    ) : (
                      <>
                        Find My Order
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Select Items */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Items to Return</CardTitle>
                  <CardDescription>
                    Choose which items from order {order?.shopify_order_id} you'd like to return
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {order && order.items.length > 0 ? (
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div 
                          key={item.id} 
                          className={`border rounded-lg p-4 transition-all cursor-pointer ${
                            selectedItems.includes(item.id) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => handleItemSelection(item.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-slate-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-slate-900">{item.product_name}</h3>
                              <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                              <p className="text-sm font-medium text-slate-900">${item.price}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {selectedItems.includes(item.id) ? (
                                <Badge className="bg-blue-600">Selected</Badge>
                              ) : (
                                <Badge variant="outline">Select</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No items found for this order. Please contact support if you believe this is an error.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Return Reason */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tell Us Why</CardTitle>
                  <CardDescription>
                    Help us improve by letting us know why you're returning these items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedItems.map((itemId) => {
                      const item = order?.items.find(i => i.id === itemId);
                      return (
                        <div key={itemId} className="border rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900">{item?.product_name}</h4>
                              <p className="text-sm text-slate-500">${item?.price}</p>
                            </div>
                          </div>
                          <Select onValueChange={(value) => handleReasonChange(itemId, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select return reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="defective">Defective/Damaged</SelectItem>
                              <SelectItem value="wrong-size">Wrong Size</SelectItem>
                              <SelectItem value="not-described">Not as Described</SelectItem>
                              <SelectItem value="changed-mind">Changed My Mind</SelectItem>
                              <SelectItem value="arrived-late">Arrived Too Late</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: AI Recommendations */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <CardTitle>Smart Recommendations</CardTitle>
                  </div>
                  <CardDescription>
                    Based on your return, we found some items you might like instead
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">AI-Powered Suggestions</span>
                      </div>
                      <p className="text-sm text-purple-700">
                        These recommendations are personalized based on your purchase history and return reason.
                      </p>
                    </div>

                    {loading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Generating AI recommendations...</span>
                      </div>
                    )}

                    {aiRecommendations.length > 0 && aiRecommendations.map((suggestion, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Package className="w-10 h-10 text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 mb-1">{suggestion.suggestedProduct}</h4>
                            <p className="text-sm text-slate-600 mb-2">{suggestion.reasoning}</p>
                            <div className="flex items-center space-x-4">
                              <Badge variant="outline" className="text-purple-600 border-purple-200">
                                {suggestion.confidence}% match
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Exchange
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Separator />

                    <div className="text-center">
                      <Button variant="outline" className="mr-3" onClick={handleSubmitReturn}>
                        Just Process Refund
                      </Button>
                      <Button onClick={handleSubmitReturn} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Complete Return'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl">Return Request Submitted!</CardTitle>
                  <CardDescription>
                    We've received your return request and will process it within 1-2 business days
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Return Details</h4>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><strong>Return ID:</strong> {submittedReturnId}</p>
                      <p><strong>Order:</strong> {order?.shopify_order_id}</p>
                      <p><strong>Items:</strong> {selectedItems.length} item(s)</p>
                      <p><strong>Status:</strong> Processing</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">What happens next?</h4>
                    <div className="text-sm text-slate-600 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>You'll receive a confirmation email within 30 minutes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>We'll send you a prepaid return label</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Refund will be processed within 5-7 business days after we receive your return</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                    <Mail className="w-4 w-4" />
                    <span>Confirmation sent to {email}</span>
                  </div>

                  <Button onClick={resetPortal} className="mt-6">
                    Process Another Return
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            {currentStep > 1 && currentStep < 5 && (
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={nextStep} disabled={!canProceed() || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : currentStep === 4 ? (
                    'Complete Return'
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage-returns">
            <ReturnManagement customerEmail={email} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CustomerPortal;
