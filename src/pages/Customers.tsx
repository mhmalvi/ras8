
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Customers = () => {
  const customers = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      totalReturns: 3,
      totalValue: "$259.97",
      status: "Active",
      lastReturn: "2024-01-15"
    },
    {
      id: "2",
      name: "Mike Chen",
      email: "mike.chen@email.com",
      totalReturns: 1,
      totalValue: "$89.99",
      status: "Active",
      lastReturn: "2024-01-14"
    },
    {
      id: "3",
      name: "Emily Davis",
      email: "emily.d@email.com",
      totalReturns: 2,
      totalValue: "$145.00",
      status: "Active",
      lastReturn: "2024-01-13"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Customer Management</h1>
                <p className="text-sm text-slate-500">Manage customers and their return history</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Overview</CardTitle>
                  <CardDescription>All customers who have made returns</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total Returns</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Return</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {customer.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-slate-500">{customer.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{customer.totalReturns}</TableCell>
                          <TableCell>{customer.totalValue}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {customer.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{customer.lastReturn}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Customers;
