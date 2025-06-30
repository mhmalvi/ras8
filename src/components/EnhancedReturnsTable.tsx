import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Package, Sparkles, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "./ExportUtils";
import AdvancedFilters from "./AdvancedFilters";
import { FilterState } from "@/types/FilterTypes";

const EnhancedReturnsTable = () => {
  const { toast } = useToast();
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    reason: 'all',
    dateRange: { from: undefined, to: undefined },
    amountRange: { min: '', max: '' },
    aiConfidence: 'all'
  });

  const mockReturns = [
    {
      id: "RT-001",
      orderNumber: "#ORD-2024-001",
      customer: {
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        avatar: ""
      },
      product: "Wireless Headphones",
      reason: "Defective item",
      value: "$129.99",
      status: "requested",
      aiSuggestion: "Premium Wireless Earbuds - 92% match",
      date: "2024-01-15",
      confidence: 92,
      numericValue: 129.99
    },
    {
      id: "RT-002",
      orderNumber: "#ORD-2024-002",
      customer: {
        name: "Mike Chen",
        email: "mike.chen@email.com",
        avatar: ""
      },
      product: "Running Shoes",
      reason: "Wrong size",
      value: "$89.99",
      status: "approved",
      aiSuggestion: "Trail Running Shoes (Size 10) - 88% match",
      date: "2024-01-14",
      confidence: 88,
      numericValue: 89.99
    },
    {
      id: "RT-003",
      orderNumber: "#ORD-2024-003",
      customer: {
        name: "Emily Davis",
        email: "emily.d@email.com",
        avatar: ""
      },
      product: "Laptop Sleeve",
      reason: "Not as described",
      value: "$45.00",
      status: "in_transit",
      aiSuggestion: "Premium Laptop Case - 95% match",
      date: "2024-01-13",
      confidence: 95,
      numericValue: 45.00
    },
    {
      id: "RT-004",
      orderNumber: "#ORD-2024-004",
      customer: {
        name: "Alex Rodriguez",
        email: "alex.r@email.com",
        avatar: ""
      },
      product: "Fitness Tracker",
      reason: "Changed mind",
      value: "$199.99",
      status: "completed",
      aiSuggestion: "Smart Watch Pro - 90% match",
      date: "2024-01-12",
      confidence: 90,
      numericValue: 199.99
    }
  ];

  // Enhanced filtering logic
  const filteredReturns = useMemo(() => {
    return mockReturns.filter(returnItem => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          returnItem.orderNumber.toLowerCase().includes(searchLower) ||
          returnItem.customer.email.toLowerCase().includes(searchLower) ||
          returnItem.customer.name.toLowerCase().includes(searchLower) ||
          returnItem.product.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && returnItem.status !== filters.status) {
        return false;
      }

      // Reason filter
      if (filters.reason !== 'all') {
        const reasonMap: { [key: string]: string } = {
          'defective': 'Defective item',
          'wrong_size': 'Wrong size',
          'not_as_described': 'Not as described',
          'changed_mind': 'Changed mind'
        };
        if (returnItem.reason !== reasonMap[filters.reason]) {
          return false;
        }
      }

      // Amount range filter
      if (filters.amountRange.min && returnItem.numericValue < parseFloat(filters.amountRange.min)) {
        return false;
      }
      if (filters.amountRange.max && returnItem.numericValue > parseFloat(filters.amountRange.max)) {
        return false;
      }

      // AI Confidence filter
      if (filters.aiConfidence !== 'all' && returnItem.confidence) {
        switch (filters.aiConfidence) {
          case 'high':
            if (returnItem.confidence < 90) return false;
            break;
          case 'medium':
            if (returnItem.confidence < 70 || returnItem.confidence >= 90) return false;
            break;
          case 'low':
            if (returnItem.confidence >= 70) return false;
            break;
        }
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const returnDate = new Date(returnItem.date);
        if (filters.dateRange.from && returnDate < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to && returnDate > filters.dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  const handleExport = () => {
    exportToCSV(filteredReturns, 'returns-filtered');
    toast({
      title: "Export completed",
      description: `Exported ${filteredReturns.length} returns to CSV file.`
    });
  };

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

  return (
    <div className="space-y-4">
      <AdvancedFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {filteredReturns.length} of {mockReturns.length} returns
        </p>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Filtered
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>AI Suggestion</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReturns.map((returnItem) => (
              <TableRow key={returnItem.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={returnItem.customer.avatar} />
                      <AvatarFallback>
                        {returnItem.customer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{returnItem.customer.name}</div>
                      <div className="text-xs text-slate-500">{returnItem.customer.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{returnItem.orderNumber}</div>
                  <div className="text-xs text-slate-500">{returnItem.date}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{returnItem.product}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{returnItem.reason}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{returnItem.value}</div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(returnItem.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="text-sm font-medium text-purple-700">
                        {returnItem.aiSuggestion.split(' - ')[0]}
                      </div>
                      <div className="text-xs text-purple-500">
                        {returnItem.confidence}% confidence
                      </div>
                    </div>
                  </div>
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
                        <DialogTitle>Return Details - {returnItem.id}</DialogTitle>
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
                                <p><strong>Name:</strong> {selectedReturn.customer.name}</p>
                                <p><strong>Email:</strong> {selectedReturn.customer.email}</p>
                                <p><strong>Order:</strong> {selectedReturn.orderNumber}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Return Information</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Product:</strong> {selectedReturn.product}</p>
                                <p><strong>Reason:</strong> {selectedReturn.reason}</p>
                                <p><strong>Value:</strong> {selectedReturn.value}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-4 bg-purple-50">
                            <div className="flex items-center space-x-2 mb-3">
                              <Sparkles className="h-5 w-5 text-purple-600" />
                              <h4 className="font-medium text-purple-900">AI Recommendation</h4>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm">{selectedReturn.aiSuggestion}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-purple-600">
                                  Confidence: {selectedReturn.confidence}%
                                </span>
                                <Badge variant="outline" className="bg-white">
                                  High Match
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline">
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Exchange
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EnhancedReturnsTable;
