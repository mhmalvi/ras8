import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, TrendingDown, TrendingUp, Search, Filter, AlertTriangle, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useRealProductSalesData } from "@/hooks/useRealProductSalesData";
import { useMerchantProfile } from "@/hooks/useMerchantProfile";

const Products = () => {
  const { salesData, loading, error } = useRealProductSalesData();
  const { profile } = useMerchantProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('return_rate');
  const [filterRisk, setFilterRisk] = useState('all');

  const getRiskLevel = (returnRate: number) => {
    if (returnRate >= 30) return 'high';
    if (returnRate >= 15) return 'medium';
    return 'low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'low': return 'text-primary bg-primary/10 border-primary/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  // Filter and sort products
  const filteredProducts = salesData
    .filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const riskLevel = getRiskLevel(product.return_rate);
      const matchesFilter = filterRisk === 'all' || riskLevel === filterRisk;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'return_rate':
          return b.return_rate - a.return_rate;
        case 'total_returns':
          return b.total_returns - a.total_returns;
        case 'total_sold':
          return b.total_sold - a.total_sold;
        case 'revenue':
          return b.total_revenue - a.total_revenue;
        default:
          return 0;
      }
    });

  // Chart data for return rate distribution
  const riskDistribution = [
    { name: 'Low Risk', value: salesData.filter(p => getRiskLevel(p.return_rate) === 'low').length, color: 'hsl(var(--primary))' },
    { name: 'Medium Risk', value: salesData.filter(p => getRiskLevel(p.return_rate) === 'medium').length, color: 'hsl(var(--warning))' },
    { name: 'High Risk', value: salesData.filter(p => getRiskLevel(p.return_rate) === 'high').length, color: 'hsl(var(--destructive))' }
  ];

  // Top problematic products for chart
  const topProblematicProducts = salesData
    .filter(p => p.return_rate > 0)
    .sort((a, b) => b.return_rate - a.return_rate)
    .slice(0, 10)
    .map(product => ({
      name: product.product_name.length > 20 ? product.product_name.substring(0, 20) + '...' : product.product_name,
      returnRate: Number(product.return_rate.toFixed(1)),
      returns: product.total_returns
    }));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading product data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Product Data</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products & Returns Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor product performance and identify return patterns
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesData.length}</div>
              <p className="text-xs text-muted-foreground">
                {salesData.filter(p => p.total_returns > 0).length} with returns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Products</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {salesData.filter(p => getRiskLevel(p.return_rate) === 'high').length}
              </div>
              <p className="text-xs text-muted-foreground">
                ≥30% return rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Return Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesData.length > 0 
                  ? (salesData.reduce((sum, p) => sum + p.return_rate, 0) / salesData.length).toFixed(1)
                  : '0'
                }%
              </div>
              <p className="text-xs text-muted-foreground">
                Across all products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesData.reduce((sum, p) => sum + p.total_returns, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Products by return risk level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Return Rates</CardTitle>
              <CardDescription>Products with highest return rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProblematicProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}%`, 
                      name === 'returnRate' ? 'Return Rate' : name
                    ]}
                  />
                  <Bar dataKey="returnRate" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Product Analysis</CardTitle>
            <CardDescription>Detailed view of all products and their return metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return_rate">Return Rate</SelectItem>
                  <SelectItem value="total_returns">Total Returns</SelectItem>
                  <SelectItem value="total_sold">Total Sold</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Table */}
            <div className="space-y-4">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No products found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const riskLevel = getRiskLevel(product.return_rate);
                  return (
                    <Card key={product.product_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{product.product_name}</h3>
                              <Badge className={getRiskColor(riskLevel)}>
                                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Total Sold</p>
                                <p className="font-semibold">{product.total_sold}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Returns</p>
                                <p className="font-semibold text-destructive">{product.total_returns}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Return Rate</p>
                                <p className="font-semibold">{product.return_rate.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Revenue</p>
                                <p className="font-semibold">${product.total_revenue.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Products;