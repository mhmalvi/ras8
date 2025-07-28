
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search, User, Mail, Calendar, TrendingUp, Eye, Package, DollarSign } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  email: string;
  totalReturns: number;
  totalAmount: number;
  lastReturn: string;
  status: 'active' | 'frequent' | 'new';
  joinDate: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerReturns, setCustomerReturns] = useState<any[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data: returns, error } = await supabase
        .from('returns')
        .select('customer_email, total_amount, created_at');

      if (error) throw error;

      // Aggregate customer data
      const customerMap = new Map<string, Customer>();
      
      returns?.forEach(returnRecord => {
        const email = returnRecord.customer_email;
        const existing = customerMap.get(email);
        
        if (existing) {
          existing.totalReturns += 1;
          existing.totalAmount += Number(returnRecord.total_amount);
          if (returnRecord.created_at > existing.lastReturn) {
            existing.lastReturn = returnRecord.created_at;
          }
        } else {
          customerMap.set(email, {
            email,
            totalReturns: 1,
            totalAmount: Number(returnRecord.total_amount),
            lastReturn: returnRecord.created_at,
            status: 'new',
            joinDate: returnRecord.created_at
          });
        }
      });

      // Determine customer status
      const customerList = Array.from(customerMap.values()).map(customer => ({
        ...customer,
        status: (customer.totalReturns >= 5 ? 'frequent' : 
                customer.totalReturns >= 2 ? 'active' : 'new') as 'active' | 'frequent' | 'new'
      }));

      // Sort by total amount descending
      customerList.sort((a, b) => b.totalAmount - a.totalAmount);
      
      setCustomers(customerList);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerReturns = async (customerEmail: string) => {
    setReturnsLoading(true);
    try {
      const { data: returns, error } = await supabase
        .from('returns')
        .select(`
          *,
          return_items (
            *
          )
        `)
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerReturns(returns || []);
    } catch (error) {
      console.error('Error fetching customer returns:', error);
      setCustomerReturns([]);
    } finally {
      setReturnsLoading(false);
    }
  };

  const handleViewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerReturns(customer.email);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'frequent': return 'destructive';
      case 'active': return 'default';
      case 'new': return 'secondary';
      default: return 'secondary';
    }
  };

  const totalCustomers = customers.length;
  const frequentCustomers = customers.filter(c => c.status === 'frequent').length;
  const totalReturnValue = customers.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage customer information and return history
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-background rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Customers</span>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">Who have made returns</p>
          </div>

          <div className="bg-background rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Frequent Returners</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">{frequentCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">5+ returns each</p>
          </div>

          <div className="bg-background rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Return Value</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">${totalReturnValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total across all customers</p>
          </div>

          <div className="bg-background rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Avg Return Value</span>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">
              ${totalCustomers > 0 ? (totalReturnValue / totalCustomers).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per customer</p>
          </div>
        </div>

        {/* Customer Management */}
        <div className="bg-background rounded-lg border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">Customer Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track customer return patterns and communication history
            </p>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading customer data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium text-muted-foreground">Customer Email</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Total Returns</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Return Value</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Last Return</TableHead>
                  <TableHead className="font-medium text-muted-foreground"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.email} className="hover:bg-muted/5">
                    <TableCell className="font-medium">{customer.email}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(customer.status) as any}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.totalReturns}</TableCell>
                    <TableCell>${customer.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(customer.lastReturn).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              Customer Details: {customer.email}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedCustomer && selectedCustomer.email === customer.email && (
                            <div className="space-y-6">
                              {/* Customer Summary */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-muted/30 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Total Returns</span>
                                  </div>
                                  <p className="text-2xl font-semibold">{customer.totalReturns}</p>
                                </div>
                                
                                <div className="bg-muted/30 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Total Value</span>
                                  </div>
                                  <p className="text-2xl font-semibold">${customer.totalAmount.toFixed(2)}</p>
                                </div>
                                
                                <div className="bg-muted/30 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Last Return</span>
                                  </div>
                                  <p className="text-lg font-medium">
                                    {new Date(customer.lastReturn).toLocaleDateString()}
                                  </p>
                                </div>
                                
                                <div className="bg-muted/30 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Status</span>
                                  </div>
                                  <Badge variant={getStatusColor(customer.status) as any}>
                                    {customer.status}
                                  </Badge>
                                </div>
                              </div>

                              <Separator />

                              {/* Return History */}
                              <div>
                                <h3 className="text-lg font-medium mb-4">Return History</h3>
                                {returnsLoading ? (
                                  <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-muted-foreground mt-2">Loading returns...</p>
                                  </div>
                                ) : customerReturns.length > 0 ? (
                                  <div className="space-y-3">
                                    {customerReturns.map((returnRecord) => (
                                      <div key={returnRecord.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="font-medium">Return #{returnRecord.id.slice(0, 8)}</h4>
                                          <Badge variant={returnRecord.status === 'completed' ? 'default' : 'secondary'}>
                                            {returnRecord.status}
                                          </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-muted-foreground">Order ID:</span>
                                            <p className="font-medium">{returnRecord.shopify_order_id}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Amount:</span>
                                            <p className="font-medium">${returnRecord.total_amount}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Date:</span>
                                            <p className="font-medium">
                                              {new Date(returnRecord.created_at).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Reason:</span>
                                            <p className="font-medium">{returnRecord.reason || 'Not specified'}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-center py-8">
                                    No detailed return data available.
                                  </p>
                                )}
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
          )}

          {!loading && filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? 'No customers found matching your search.' : 'No customer data available.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Customers;
