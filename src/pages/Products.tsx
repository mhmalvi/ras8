
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useProductsData } from "@/hooks/useProductsData";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

const Products = () => {
  const { products, loading, error, refetch } = useProductsData();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Product Analysis</h1>
                  <p className="text-sm text-slate-500">Analyze products and their return patterns</p>
                </div>
              </div>
              <Button
                onClick={refetch}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Product Return Analysis</CardTitle>
                  <CardDescription>
                    {loading ? (
                      "Loading products..."
                    ) : error ? (
                      `Error: ${error}`
                    ) : (
                      `${products.length} products with return data`
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-4">Failed to load products: {error}</p>
                      <Button onClick={refetch} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No products found. Product data will appear here once customers start returning items.</p>
                    </div>
                  ) : (
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
                  )}
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
