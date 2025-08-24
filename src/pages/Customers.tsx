
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search, User, Mail, Calendar, TrendingUp, Eye, Package, DollarSign, Users } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";

interface Customer {
  email: string;
  totalReturns: number;
  totalAmount: number;
  lastReturn: string;
  status: 'active' | 'frequent' | 'new';
  joinDate: string;
}

const Customers = () => {
  const { profile } = useMerchantProfile();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerReturns, setCustomerReturns] = useState<any[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);

  useEffect(() => {
    if (profile?.merchant_id) {
      fetchCustomers();
    }
  }, [profile?.merchant_id]);

  const fetchCustomers = async () => {
    const merchantId = profile?.merchant_id;

    if (!merchantId) {
      console.error('No merchant context available');
      setLoading(false);
      return;
    }

    try {
      // SECURITY FIX: Add merchant_id filtering to prevent cross-tenant data exposure
      const { data: returns, error } = await supabase
        .from('returns')
        .select('customer_email, total_amount, created_at, merchant_id')
        .eq('merchant_id', merchantId);

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
    const merchantId = profile?.merchant_id;

    if (!merchantId) {
      console.error('No merchant context available');
      setReturnsLoading(false);
      return;
    }

    setReturnsLoading(true);
    try {
      // SECURITY FIX: Add merchant_id filtering to customer return details
      const { data: returns, error } = await supabase
        .from('returns')
        .select(`
          *,
          return_items (
            *
          )
        `)
        .eq('customer_email', customerEmail)
        .eq('merchant_id', merchantId)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Customers
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              View and manage customer information and return history
            </p>
            <Separator className="mt-4" />
          </div>
          
          {/* Stats Cards */}
          <section className="animate-fade-in">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Total Customers</span>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">{totalCustomers}</div>
                  <p className="text-sm text-muted-foreground mt-2">Who have made returns</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Frequent Returners</span>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">{frequentCustomers}</div>
                  <p className="text-sm text-muted-foreground mt-2">5+ returns each</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Return Value</span>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">${totalReturnValue.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground mt-2">Total across all customers</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Avg Return Value</span>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    ${totalCustomers > 0 ? (totalReturnValue / totalCustomers).toFixed(2) : '0.00'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Per customer</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Customer Management */}
          <section className="animate-fade-in">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span>Customer Management</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Track customer return patterns and communication history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search customers by email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
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
                                  className="h-8 w-8 p-0 force-interactive"
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
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Customers;
