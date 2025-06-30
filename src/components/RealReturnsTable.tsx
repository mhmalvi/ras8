
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Package, Sparkles, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealReturnsData } from "@/hooks/useRealReturnsData";

interface RealReturnsTableProps {
  searchTerm: string;
  statusFilter: string;
}

const RealReturnsTable = ({ searchTerm, statusFilter }: RealReturnsTableProps) => {
  const { toast } = useToast();
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const { returns, loading, error, refetch } = useRealReturnsData();

  // Enhanced filtering logic
  const filteredReturns = useMemo(() => {
    return returns.filter(returnItem => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          returnItem.shopify_order_id.toLowerCase().includes(searchLower) ||
          returnItem.customer_email.toLowerCase().includes(searchLower) ||
          returnItem.reason.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && returnItem.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [returns, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      requested: { label: "Requested", variant: "secondary" as const, icon: Clock },
      approved: { label: "Approved", variant: "default" as const, icon: CheckCircle },
      in_transit: { label: "In Transit", variant: "outline" as const, icon: Package },
      completed: { label: "Completed", variant: "default" as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.requested;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCustomerName = (email: string) => {
    // Extract name from email or create initials
    const namePart = email.split('@')[0];
    return namePart.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading returns data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Error loading returns: {error}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {filteredReturns.length} of {returns.length} returns
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>AI Suggestions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  {returns.length === 0 
                    ? "No returns found. Returns will appear here once customers submit them."
                    : "No returns found matching your filters."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredReturns.map((returnItem) => (
                <TableRow key={returnItem.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getCustomerName(returnItem.customer_email).split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{getCustomerName(returnItem.customer_email)}</div>
                        <div className="text-xs text-slate-500">{returnItem.customer_email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">#{returnItem.shopify_order_id}</div>
                    <div className="text-xs text-slate-500">{formatDate(returnItem.created_at)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {returnItem.return_items?.length || 0} item{(returnItem.return_items?.length || 0) !== 1 ? 's' : ''}
                    </div>
                    {returnItem.return_items?.[0] && (
                      <div className="text-xs text-slate-500 truncate max-w-32">
                        {returnItem.return_items[0].product_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{returnItem.reason}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(returnItem.total_amount)}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(returnItem.status)}
                  </TableCell>
                  <TableCell>
                    {returnItem.ai_suggestions && returnItem.ai_suggestions.length > 0 ? (
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="text-sm font-medium text-purple-700 truncate max-w-32">
                            {returnItem.ai_suggestions[0].suggested_product_name}
                          </div>
                          <div className="text-xs text-purple-500">
                            {returnItem.ai_suggestions[0].confidence_score}% confidence
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No suggestions</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedReturn(returnItem)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Return Details - {returnItem.id.slice(0, 8)}</DialogTitle>
                          <DialogDescription>
                            Manage this return request and AI recommendations
                          </DialogDescription>
                        </DialogHeader>
                        {selectedReturn && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Customer Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Name:</strong> {getCustomerName(selectedReturn.customer_email)}</p>
                                  <p><strong>Email:</strong> {selectedReturn.customer_email}</p>
                                  <p><strong>Order:</strong> #{selectedReturn.shopify_order_id}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Return Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Items:</strong> {selectedReturn.return_items?.length || 0}</p>
                                  <p><strong>Reason:</strong> {selectedReturn.reason}</p>
                                  <p><strong>Value:</strong> {formatCurrency(selectedReturn.total_amount)}</p>
                                  <p><strong>Status:</strong> {selectedReturn.status}</p>
                                </div>
                              </div>
                            </div>
                            
                            {selectedReturn.ai_suggestions && selectedReturn.ai_suggestions.length > 0 && (
                              <div className="border rounded-lg p-4 bg-purple-50">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Sparkles className="h-5 w-5 text-purple-600" />
                                  <h4 className="font-medium text-purple-900">AI Recommendation</h4>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm">{selectedReturn.ai_suggestions[0].suggested_product_name}</p>
                                  <p className="text-xs text-slate-600">{selectedReturn.ai_suggestions[0].reasoning}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-purple-600">
                                      Confidence: {selectedReturn.ai_suggestions[0].confidence_score}%
                                    </span>
                                    <Badge variant="outline" className="bg-white">
                                      {selectedReturn.ai_suggestions[0].confidence_score >= 90 ? 'High Match' : 
                                       selectedReturn.ai_suggestions[0].confidence_score >= 70 ? 'Medium Match' : 'Low Match'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end space-x-2">
                              <Button variant="outline">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RealReturnsTable;
