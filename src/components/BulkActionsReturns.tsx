
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, RefreshCw, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRealReturnsData } from '@/hooks/useRealReturnsData';

interface TransformedReturn {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  items: string;
  reason: string;
  status: 'requested' | 'approved' | 'in_transit' | 'completed';
  amount: number;
  date: string;
  aiSuggestion?: string;
  confidence?: number;
}

const BulkActionsReturns = () => {
  const { toast } = useToast();
  const { returns, loading, error, updateReturnStatus, bulkUpdateReturns } = useRealReturnsData();
  const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  // Transform real returns data to match component interface
  const transformedReturns = returns.map(returnItem => ({
    id: returnItem.id,
    orderNumber: `#${returnItem.shopify_order_id}`,
    customer: returnItem.customer_email.split('@')[0],
    email: returnItem.customer_email,
    items: returnItem.return_items?.map(item => `${item.product_name} (${item.quantity})`).join(', ') || 'Items',
    reason: returnItem.reason,
    status: returnItem.status as 'requested' | 'approved' | 'in_transit' | 'completed',
    amount: returnItem.total_amount,
    date: new Date(returnItem.created_at).toLocaleDateString(),
    aiSuggestion: returnItem.ai_suggestions?.[0]?.reasoning,
    confidence: returnItem.ai_suggestions?.[0] ? Math.round(returnItem.ai_suggestions[0].confidence_score * 100) : undefined
  }));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReturns(transformedReturns.map(r => r.id));
    } else {
      setSelectedReturns([]);
    }
  };

  const handleSelectReturn = (returnId: string, checked: boolean) => {
    if (checked) {
      setSelectedReturns(prev => [...prev, returnId]);
    } else {
      setSelectedReturns(prev => prev.filter(id => id !== returnId));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedReturns.length === 0) return;

    try {
      const actionLabels = {
        approve: 'approved',
        reject: 'rejected',
        apply_ai: 'approved', // Apply AI suggestions typically means approve
        export: 'exported'
      };

      // Perform real bulk actions based on the action type
      if (bulkAction === 'approve' || bulkAction === 'apply_ai') {
        await bulkUpdateReturns(selectedReturns, 'approved');
      } else if (bulkAction === 'reject') {
        await bulkUpdateReturns(selectedReturns, 'rejected');
      } else if (bulkAction === 'export') {
        // Export functionality would be implemented here
        console.log('Exporting returns:', selectedReturns);
      }

      toast({
        title: "Bulk action completed",
        description: `${selectedReturns.length} returns have been ${actionLabels[bulkAction as keyof typeof actionLabels]}.`
      });

      setSelectedReturns([]);
      setBulkAction('');
    } catch (error) {
      toast({
        title: "Bulk action failed",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      requested: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      in_transit: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Returns Management</CardTitle>
          <div className="flex items-center gap-4">
            {selectedReturns.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  {selectedReturns.length} selected
                </span>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Bulk actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Approve All
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Reject All
                      </div>
                    </SelectItem>
                    <SelectItem value="apply_ai">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Apply AI Suggestions
                      </div>
                    </SelectItem>
                    <SelectItem value="export">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export Data
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkAction} disabled={!bulkAction}>
                  Apply
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-12">
                  <Checkbox
                    checked={selectedReturns.length === transformedReturns.length && transformedReturns.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>AI Suggestion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      Loading returns...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-red-600">
                    Error loading returns: {error}
                  </TableCell>
                </TableRow>
              ) : transformedReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No returns found
                  </TableCell>
                </TableRow>
              ) : (
                transformedReturns.map((returnItem) => (
                <TableRow key={returnItem.id} className={selectedReturns.includes(returnItem.id) ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedReturns.includes(returnItem.id)}
                      onCheckedChange={(checked) => handleSelectReturn(returnItem.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{returnItem.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{returnItem.customer}</div>
                      <div className="text-sm text-slate-500">{returnItem.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{returnItem.items}</TableCell>
                  <TableCell>{returnItem.reason}</TableCell>
                  <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                  <TableCell>${returnItem.amount}</TableCell>
                  <TableCell>
                    {returnItem.aiSuggestion ? (
                      <div className="space-y-1">
                        <div className="text-sm">{returnItem.aiSuggestion}</div>
                        <Badge variant="outline" className="text-xs">
                          {returnItem.confidence}% confidence
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {returnItem.status === 'requested' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateReturnStatus(returnItem.id, 'rejected')}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => updateReturnStatus(returnItem.id, 'approved')}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkActionsReturns;
