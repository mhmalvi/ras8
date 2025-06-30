
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Products = () => {
  const products = [
    {
      id: "1",
      name: "Wireless Headphones",
      sku: "WH-001",
      category: "Electronics",
      returnRate: "12%",
      totalReturns: 15,
      mainReason: "Defective"
    },
    {
      id: "2",
      name: "Running Shoes",
      sku: "RS-002",
      category: "Footwear",
      returnRate: "8%",
      totalReturns: 8,
      mainReason: "Wrong size"
    },
    {
      id: "3",
      name: "Laptop Sleeve",
      sku: "LS-003",
      category: "Accessories",
      returnRate: "5%",
      totalReturns: 3,
      mainReason: "Not as described"
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
                <h1 className="text-xl font-semibold text-slate-900">Product Analysis</h1>
                <p className="text-sm text-slate-500">Analyze products and their return patterns</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Product Return Analysis</CardTitle>
                  <CardDescription>Products with their return rates and common reasons</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Return Rate</TableHead>
                        <TableHead>Total Returns</TableHead>
                        <TableHead>Main Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-slate-500">SKU: {product.sku}</div>
                            </div>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                parseFloat(product.returnRate) > 10 
                                  ? "bg-red-50 text-red-700" 
                                  : "bg-green-50 text-green-700"
                              }
                            >
                              {product.returnRate}
                            </Badge>
                          </TableCell>
                          <TableCell>{product.totalReturns}</TableCell>
                          <TableCell>{product.mainReason}</TableCell>
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

export default Products;
