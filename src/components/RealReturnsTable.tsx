import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, User, Package, Brain, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRealReturnsData } from "@/hooks/useRealReturnsData";
import ReturnProcessingModal from "./ReturnProcessingModal";
import { useToast } from "@/hooks/use-toast";

interface RealReturnsTableProps {
  searchTerm: string;
  statusFilter: string;
}

const RealReturnsTable = ({ searchTerm, statusFilter }: RealReturnsTableProps) => {
  const { returns, loading, error, refetch } = useRealReturnsData();
  const { toast } = useToast();
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter returns based on search term and status
  const filteredReturns = useMemo(() => {
    return returns.filter(returnItem => {
      const matchesSearch = !searchTerm || 
        returnItem.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.shopify_order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [returns, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_transit': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewReturn = (returnItem: any) => {
    console.log('📋 Opening return details for:', returnItem.id);
    setSelectedReturn(returnItem);
    setIsModalOpen(true);
  };

  const handleProcessingComplete = async (result: any) => {
    console.log('✅ Processing completed:', result);
    
    toast({
      title: "Return Processed",
      description: `Return ${result.action} successfully.`,
    });
    
    // Refresh the data
    await refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Loading returns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Error loading returns</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={refetch} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (filteredReturns.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          {returns.length === 0 ? 'No returns found' : 'No matching returns'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {returns.length === 0 
            ? 'When customers submit returns, they will appear here.' 
            : 'Try adjusting your search or filter criteria.'
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="font-medium text-muted-foreground">Order</TableHead>
            <TableHead className="font-medium text-muted-foreground">Customer</TableHead>
            <TableHead className="font-medium text-muted-foreground">Items</TableHead>
            <TableHead className="font-medium text-muted-foreground">Amount</TableHead>
            <TableHead className="font-medium text-muted-foreground">Status</TableHead>
            <TableHead className="font-medium text-muted-foreground">AI Score</TableHead>
            <TableHead className="font-medium text-muted-foreground">Date</TableHead>
            <TableHead className="font-medium text-muted-foreground"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReturns.map((returnItem) => (
            <TableRow key={returnItem.id} className="hover:bg-muted/5">
              <TableCell className="font-medium">
                #{returnItem.shopify_order_id.slice(0, 8)}
              </TableCell>
              <TableCell>
                <div className="text-sm">{returnItem.customer_email}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">
                    {returnItem.return_items?.length || 1}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                ${returnItem.total_amount.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(returnItem.status)}
                >
                  {returnItem.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {returnItem.ai_suggestions && returnItem.ai_suggestions.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <Brain className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {Math.round((returnItem.ai_suggestions[0]?.confidence_score || 0) * 100)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(returnItem.created_at), 'MMM dd')}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewReturn(returnItem)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Return Processing Modal */}
      {selectedReturn && (
        <ReturnProcessingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReturn(null);
          }}
          returnData={selectedReturn}
          onProcessingComplete={handleProcessingComplete}
        />
      )}
    </>
  );
};

export default RealReturnsTable;
