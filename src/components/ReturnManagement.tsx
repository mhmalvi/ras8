
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Edit3, Trash2, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";
import { useToast } from "@/hooks/use-toast";

interface ReturnManagementProps {
  customerEmail: string;
}

const ReturnManagement = ({ customerEmail }: ReturnManagementProps) => {
  const { toast } = useToast();
  const { returns, loading, error, fetchCustomerReturns, updateReturn, cancelReturn } = useCustomerPortal();
  const [editingReturn, setEditingReturn] = useState<string | null>(null);
  const [editReasons, setEditReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customerEmail) {
      fetchCustomerReturns(customerEmail);
    }
  }, [customerEmail]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleUpdateReturn = async (returnId: string) => {
    try {
      await updateReturn(returnId, { returnReasons: editReasons });
      setEditingReturn(null);
      setEditReasons({});
      toast({
        title: "Return Updated",
        description: "Your return request has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update return",
        variant: "destructive"
      });
    }
  };

  const handleCancelReturn = async (returnId: string) => {
    try {
      await cancelReturn(returnId);
      toast({
        title: "Return Cancelled",
        description: "Your return request has been cancelled successfully."
      });
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel return",
        variant: "destructive"
      });
    }
  };

  const canModifyReturn = (status: string) => {
    return ['requested', 'pending'].includes(status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading your returns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Your Returns</h2>
        <Badge variant="outline" className="text-sm">
          {returns.length} {returns.length === 1 ? 'return' : 'returns'}
        </Badge>
      </div>

      {returns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No returns found</h3>
            <p className="text-slate-500">You haven't submitted any return requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {returns.map((returnItem) => (
            <Card key={returnItem.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order {returnItem.shopify_order_id}</CardTitle>
                    <CardDescription>
                      Submitted on {new Date(returnItem.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(returnItem.status)}>
                      {getStatusIcon(returnItem.status)}
                      <span className="ml-1 capitalize">{returnItem.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Items ({returnItem.items.length})</h4>
                  <div className="space-y-2">
                    {returnItem.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{item.product_name}</p>
                            <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">${item.price}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.action}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Return Reason</h4>
                  <p className="text-slate-600">{returnItem.reason}</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    Total: ${returnItem.total_amount}
                  </p>
                </div>

                {canModifyReturn(returnItem.status) && (
                  <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingReturn(returnItem.id);
                            setEditReasons({ [returnItem.id]: returnItem.reason });
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Reason
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Return Reason</DialogTitle>
                          <DialogDescription>
                            Update the reason for your return request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reason">Return Reason</Label>
                            <Select 
                              value={editReasons[returnItem.id] || ''}
                              onValueChange={(value) => setEditReasons({ ...editReasons, [returnItem.id]: value })}
                            >
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
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingReturn(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleUpdateReturn(returnItem.id)}
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                'Update Return'
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Return Request</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel this return request? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline">
                            Keep Return
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelReturn(returnItem.id)}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              'Cancel Return'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnManagement;
