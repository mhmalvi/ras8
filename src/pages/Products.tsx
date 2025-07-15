
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, TrendingDown, DollarSign, AlertTriangle, Settings } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  product_id: string;
  product_name: string;
  totalReturns: number;
  totalValue: number;
  returnRate: number;
  risk: 'low' | 'medium' | 'high';
  avgPrice: number;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: returnItems, error } = await supabase
        .from('return_items')
        .select('product_id, product_name, price, quantity');

      if (error) throw error;

      // Aggregate product data
      const productMap = new Map<string, Product>();
      
      returnItems?.forEach(item => {
        const existing = productMap.get(item.product_id);
        const value = Number(item.price) * (item.quantity || 1);
        
        if (existing) {
          existing.totalReturns += item.quantity || 1;
          existing.totalValue += value;
        } else {
          productMap.set(item.product_id, {
            product_id: item.product_id,
            product_name: item.product_name,
            totalReturns: item.quantity || 1,
            totalValue: value,
            returnRate: 0,
            risk: 'low',
            avgPrice: Number(item.price)
          });
        }
      });

      // Calculate metrics and risk levels
      const productList = Array.from(productMap.values()).map(product => {
        // Mock some additional data for better demonstration
        const mockTotalSold = Math.max(product.totalReturns * (5 + Math.random() * 15), product.totalReturns);
        const returnRate = (product.totalReturns / mockTotalSold) * 100;
        
        return {
          ...product,
          returnRate,
          risk: (returnRate > 15 ? 'high' : returnRate > 8 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
          avgPrice: product.totalValue / product.totalReturns
        };
      });

      // Sort by return rate descending
      productList.sort((a, b) => b.returnRate - a.returnRate);
      
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const totalProducts = products.length;
  const highRiskProducts = products.filter(p => p.risk === 'high').length;
  const totalReturnValue = products.reduce((sum, p) => sum + p.totalValue, 0);
  const avgReturnRate = totalProducts > 0 ? 
    products.reduce((sum, p) => sum + p.returnRate, 0) / totalProducts : 0;

  return (
    <AppLayout 
      title="Products" 
      description="Manage products and return eligibility settings"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products with Returns</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">Have generated returns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Products</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highRiskProducts}</div>
              <p className="text-xs text-muted-foreground">&gt;15% return rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Return Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalReturnValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total product returns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Return Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgReturnRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>
        </div>

        {/* Product Management */}
        <Card>
          <CardHeader>
            <CardTitle>Product Return Analysis</CardTitle>
            <CardDescription>
              Configure product return policies and track return rates by product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading product data...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Return Risk</TableHead>
                    <TableHead>Total Returns</TableHead>
                    <TableHead>Return Rate</TableHead>
                    <TableHead>Return Value</TableHead>
                    <TableHead>Avg Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.product_id}</TableCell>
                      <TableCell>
                        <Badge variant={getRiskColor(product.risk) as any}>
                          {product.risk} risk
                        </Badge>
                      </TableCell>
                      <TableCell>{product.totalReturns}</TableCell>
                      <TableCell>{product.returnRate.toFixed(1)}%</TableCell>
                      <TableCell>${product.totalValue.toFixed(2)}</TableCell>
                      <TableCell>${product.avgPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No products found matching your search.' : 'No product return data available.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Policy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Return Policy Settings</CardTitle>
            <CardDescription>Configure global return policies and product-specific rules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Default Return Window</h4>
                <p className="text-sm text-muted-foreground mb-2">How long customers have to initiate returns</p>
                <Input placeholder="30 days" className="w-full" />
              </div>
              <div>
                <h4 className="font-medium mb-2">Automatic Approval Threshold</h4>
                <p className="text-sm text-muted-foreground mb-2">Auto-approve returns under this amount</p>
                <Input placeholder="$50.00" className="w-full" />
              </div>
            </div>
            <Button className="mt-4">Save Policy Settings</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Products;
