
import React, { useState } from 'react';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';

const CustomerPortal = () => {
  const {
    orderData,
    returnData,
    loading,
    error,
    lookupOrder,
    submitReturn,
    trackReturn
  } = useCustomerPortal();

  const [lookupForm, setLookupForm] = useState({
    orderNumber: '',
    email: ''
  });

  const [returnForm, setReturnForm] = useState({
    reason: '',
    description: '',
    selectedItems: [] as string[]
  });

  const [trackingNumber, setTrackingNumber] = useState('');

  const handleOrderLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    await lookupOrder(lookupForm.orderNumber, lookupForm.email);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData) return;

    await submitReturn({
      orderId: orderData.id,
      reason: returnForm.reason,
      description: returnForm.description,
      items: returnForm.selectedItems.map(itemId => ({
        id: itemId,
        quantity: 1 // For simplicity, allowing 1 item return
      }))
    });
  };

  const handleTrackReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    await trackReturn(trackingNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Returns Portal</h1>
          <p className="text-gray-600 mt-2">Easily manage your returns and exchanges</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Order Lookup */}
        {!orderData && !returnData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Find Your Order
              </CardTitle>
              <CardDescription>
                Enter your order details to start a return
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOrderLookup} className="space-y-4">
                <div>
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    value={lookupForm.orderNumber}
                    onChange={(e) => setLookupForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                    placeholder="e.g., #1001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={lookupForm.email}
                    onChange={(e) => setLookupForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Looking up...' : 'Find Order'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Order Details & Return Form */}
        {orderData && !returnData && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Order #{orderData.shopify_order_id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Customer:</span>
                    <span>{orderData.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total:</span>
                    <span>${orderData.total_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant="secondary">{orderData.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Return Request</CardTitle>
                <CardDescription>
                  Tell us why you'd like to return this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReturnSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="reason">Reason for Return</Label>
                    <Select 
                      value={returnForm.reason} 
                      onValueChange={(value) => setReturnForm(prev => ({ ...prev, reason: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defective">Defective/Damaged</SelectItem>
                        <SelectItem value="wrong_size">Wrong Size</SelectItem>
                        <SelectItem value="wrong_color">Wrong Color</SelectItem>
                        <SelectItem value="not_as_described">Not as Described</SelectItem>
                        <SelectItem value="changed_mind">Changed Mind</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Additional Details (Optional)</Label>
                    <Textarea
                      id="description"
                      value={returnForm.description}
                      onChange={(e) => setReturnForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Please provide any additional details about your return..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={loading || !returnForm.reason}>
                    {loading ? 'Submitting...' : 'Submit Return Request'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {/* Return Confirmation */}
        {returnData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <CheckCircle className="mr-2 h-5 w-5" />
                Return Request Submitted
              </CardTitle>
              <CardDescription>
                Your return has been processed successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Return ID:</span>
                  <span className="font-mono">{returnData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge>{returnData.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reason:</span>
                  <span>{returnData.reason}</span>
                </div>
                
                <Separator />
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We'll review your return request within 24 hours</li>
                    <li>• You'll receive an email with return shipping instructions</li>
                    <li>• Once we receive your return, we'll process your refund</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Return Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Track Existing Return
            </CardTitle>
            <CardDescription>
              Check the status of a previous return
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackReturn} className="space-y-4">
              <div>
                <Label htmlFor="trackingNumber">Return ID</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter your return ID"
                />
              </div>
              <Button type="submit" variant="outline" disabled={loading}>
                {loading ? 'Tracking...' : 'Track Return'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerPortal;
