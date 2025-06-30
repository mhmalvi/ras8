
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, RefreshCw, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Return {
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
  const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  const returns: Return[] = [
    {
      id: '1',
      orderNumber: '#12345',
      customer: 'John Doe',
      email: 'john@example.com',
      items: 'Blue T-Shirt (L)',
      reason: 'Too small',
      status: 'requested',
      amount: 29.99,
      date: '2024-01-15',
      aiSuggestion: 'Exchange for XL size',
      confidence: 94
    },
    {
      id: '2',
      orderNumber: '#12346',
      customer: 'Sarah Smith',
      email: 'sarah@example.com',
      items: 'Red Dress (M)',
      reason: 'Wrong color',
      status: 'requested',
      amount: 89.99,
      date: '2024-01-14',
      aiSuggestion: 'Exchange for Black Dress',
      confidence: 87
    },
    {
      id: '3',
      orderNumber: '#12347',
      customer: 'Mike Johnson',
      email: 'mike@example.com',
      items: 'Running Shoes (10)',
      reason: 'Defective',
      status: 'approved',
      amount: 129.99,
      date: '2024-01-13'
    },
    {
      id: '4',
      orderNumber: '#12348',
      customer: 'Lisa Brown',
      email: 'lisa@example.com',
      items: 'Winter Jacket (S)',
      reason: 'Too large',
      status: 'requested',
      amount: 199.99,
      date: '2024-01-12',
      aiSuggestion: 'Exchange for XS size',
      confidence: 92
    }
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReturns(returns.map(r => r.id));
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

  const handleBulkAction = () => {
    if (!bulkAction || selectedReturns.length === 0) return;

    const actionLabels = {
      approve: 'approved',
      reject: 'rejected',
      apply_ai: 'AI suggestions applied to',
      export: 'exported'
    };

    toast({
      title: "Bulk action completed",
      description: `${selectedReturns.length} returns have been ${actionLabels[bulkAction as keyof typeof actionLabels]}.`
    });

    setSelectedReturns([]);
    setBulkAction('');
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
                    checked={selectedReturns.length === returns.length}
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
              {returns.map((returnItem) => (
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
                          <Button variant="outline" size="sm">
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm">
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkActionsReturns;
