
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          console.log('View customer:', customer.email);
                        }}
                      >
                        <Eye className="h-4 w-4" />
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
        </div>
      </div>
    </AppLayout>
  );
};

export default Customers;
