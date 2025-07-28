
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
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage products and return eligibility settings
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-background rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Products with Returns</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Have generated returns</p>
          </div>

          <div className="bg-background rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">High Risk Products</span>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">{highRiskProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">&gt;15% return rate</p>
          </div>

          <div className="bg-background rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Return Value</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">${totalReturnValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total product returns</p>
          </div>

          <div className="bg-background rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Avg Return Rate</span>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold text-foreground">{avgReturnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all products</p>
          </div>
        </div>

        {/* Product Management */}
        <div className="bg-background rounded-lg border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">Product Return Analysis</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure product return policies and track return rates by product
            </p>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
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
                  <TableHead className="font-medium text-muted-foreground">Product</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Product ID</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Risk Level</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Returns</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Return Rate</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Value</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Avg Price</TableHead>
                  <TableHead className="font-medium text-muted-foreground"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.product_id} className="hover:bg-muted/5">
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.product_id}</TableCell>
                    <TableCell>
                      <Badge variant={getRiskColor(product.risk) as any}>
                        {product.risk}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.totalReturns}</TableCell>
                    <TableCell>{product.returnRate.toFixed(1)}%</TableCell>
                    <TableCell>${product.totalValue.toFixed(2)}</TableCell>
                    <TableCell>${product.avgPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Settings className="h-4 w-4" />
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
        </div>

        {/* Return Policy Settings */}
        <div className="bg-background rounded-lg border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">Return Policy Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure global return policies and product-specific rules</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2 text-foreground">Default Return Window</h4>
              <p className="text-sm text-muted-foreground mb-2">How long customers have to initiate returns</p>
              <Input placeholder="30 days" className="w-full" />
            </div>
            <div>
              <h4 className="font-medium mb-2 text-foreground">Automatic Approval Threshold</h4>
              <p className="text-sm text-muted-foreground mb-2">Auto-approve returns under this amount</p>
              <Input placeholder="$50.00" className="w-full" />
            </div>
          </div>
          <Button className="mt-4">Save Policy Settings</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Products;
