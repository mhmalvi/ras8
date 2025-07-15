
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, Mail, Calendar, TrendingUp, Eye } from "lucide-react";
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
    <AppLayout 
      title="Customers" 
      description="View and manage customer information and return history"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Who have made returns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Frequent Returners</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{frequentCustomers}</div>
              <p className="text-xs text-muted-foreground">5+ returns each</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Return Value</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalReturnValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total across all customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Return Value</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalCustomers > 0 ? (totalReturnValue / totalCustomers).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Per customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Management</CardTitle>
            <CardDescription>
              Track customer return patterns and communication history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
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
                    <TableHead>Customer Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Returns</TableHead>
                    <TableHead>Return Value</TableHead>
                    <TableHead>Last Return</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.email}>
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
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
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
      </div>
    </AppLayout>
  );
};

export default Customers;
