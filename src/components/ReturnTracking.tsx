
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Search, Clock, CheckCircle, Truck, RotateCcw, Mail, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner, CustomerLoadingState } from './LoadingStates';
import GlobalErrorBoundary from './GlobalErrorBoundary';

interface TrackingInfo {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  status: string;
  reason: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  return_items?: Array<{
    product_name: string;
    quantity: number;
    action: string;
  }>;
  timeline: Array<{
    status: string;
    timestamp: string;
    description: string;
  }>;
}

const ReturnTracking = () => {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [email, setEmail] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'in_transit': return <Truck className="h-4 w-4 text-purple-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateTimeline = (returnData: any): Array<{status: string; timestamp: string; description: string}> => {
    const timeline = [
      {
        status: 'requested',
        timestamp: returnData.created_at,
        description: 'Return request submitted and is being reviewed'
      }
    ];

    if (returnData.status === 'approved' || returnData.status === 'in_transit' || returnData.status === 'completed') {
      timeline.push({
        status: 'approved',
        timestamp: returnData.updated_at,
        description: 'Return request approved. Return label will be sent via email'
      });
    }

    if (returnData.status === 'in_transit' || returnData.status === 'completed') {
      timeline.push({
        status: 'in_transit',
        timestamp: returnData.updated_at,
        description: 'Package received and being processed'
      });
    }

    if (returnData.status === 'completed') {
      timeline.push({
        status: 'completed',
        timestamp: returnData.updated_at,
        description: 'Return processed and refund issued'
      });
    }

    return timeline;
  };

  const trackReturn = async () => {
    if (!trackingNumber.trim() || !email.trim()) {
      setError('Please enter both tracking number and email address');
      return;
    }

    setLoading(true);
    setError(null);
    setTrackingInfo(null);

    try {
      console.log('🔍 Tracking return:', { trackingNumber, email });

      // Try to find return by order ID and email
      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .select(`
          *,
          return_items (
            product_name,
            quantity,
            action
          )
        `)
        .eq('shopify_order_id', trackingNumber)
        .eq('customer_email', email.toLowerCase())
        .single();

      if (returnError) {
        console.error('Return lookup error:', returnError);
        
        if (returnError.code === 'PGRST116') {
          setError('No return found with this tracking number and email address');
        } else {
          setError('Error looking up return. Please try again.');
        }
        return;
      }

      if (returnData) {
        const timeline = generateTimeline(returnData);
        
        setTrackingInfo({
          ...returnData,
          timeline
        });

        toast({
          title: "Return Found",
          description: "Your return information has been loaded successfully.",
        });
      }

    } catch (error) {
      console.error('Tracking error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetTracking = () => {
    setTrackingInfo(null);
    setTrackingNumber('');
    setEmail('');
    setError(null);
  };

  const requestUpdate = async () => {
    if (!trackingInfo) return;

    try {
      // In a real implementation, this would send an email or create a support ticket
      toast({
        title: "Update Requested",
        description: "We'll send you an email update within 24 hours.",
      });
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Unable to request update. Please contact support.",
        variant: "destructive"
      });
    }
  };

  return (
    <GlobalErrorBoundary level="component">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Track Your Return</CardTitle>
            <CardDescription>
              Enter your order number and email to check your return status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Order Number</label>
              <Input
                placeholder="e.g., ORD-2024-3008"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <Button 
              onClick={trackReturn} 
              disabled={loading || !trackingNumber.trim() || !email.trim()}
              className="w-full"
            >
              {loading ? (
                <LoadingSpinner size="sm" text="Tracking..." />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Track Return
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {trackingInfo && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Return #{trackingInfo.shopify_order_id}
                  </CardTitle>
                  <CardDescription>
                    Submitted on {new Date(trackingInfo.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(trackingInfo.status)}>
                  {trackingInfo.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Return Details */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Return Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{trackingInfo.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason:</span>
                    <span>{trackingInfo.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>${trackingInfo.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items:</span>
                    <span>{trackingInfo.return_items?.length || 1} item(s)</span>
                  </div>
                </div>
              </div>

              {/* Items Being Returned */}
              {trackingInfo.return_items && trackingInfo.return_items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Items Being Returned</h4>
                  <div className="space-y-2">
                    {trackingInfo.return_items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <Badge variant="outline">
                          {item.action === 'refund' ? 'Refund' : 'Exchange'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="font-medium mb-4">Return Progress</h4>
                <div className="space-y-4">
                  {trackingInfo.timeline.map((event, index) => {
                    const isCompleted = trackingInfo.timeline.findIndex(t => t.status === trackingInfo.status) >= index;
                    const isCurrent = event.status === trackingInfo.status;
                    
                    return (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`p-1 rounded-full ${
                          isCompleted ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className={`font-medium ${
                              isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {event.status.replace('_', ' ').toUpperCase()}
                            </p>
                            {isCurrent && (
                              <Badge variant="outline" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <p className={`text-sm ${
                            isCompleted ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {event.description}
                          </p>
                          {isCompleted && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button onClick={requestUpdate} variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Request Update
                </Button>
                <Button onClick={resetTracking} variant="outline" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Track Another Return
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </GlobalErrorBoundary>
  );
};

export default ReturnTracking;
