import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMasterAdminData } from "@/hooks/useMasterAdminData";
import { Store, Users, TrendingUp, Clock, MoreHorizontal } from "lucide-react";

const MerchantsTab = () => {
  const { stats, merchants, loading } = useMasterAdminData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trial': return 'text-blue-600 bg-blue-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'pro': return 'text-purple-600 bg-purple-100';
      case 'growth': return 'text-blue-600 bg-blue-100';
      case 'starter': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const totalRevenue = merchants.reduce((sum, merchant) => sum + (merchant.totalRevenue || 0), 0);
  const totalReturns = merchants.reduce((sum, merchant) => sum + (merchant.returnsCount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Merchants</h1>
        <p className="text-slate-600">Manage and monitor all merchants on the platform</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900">Total Merchants</h3>
            {loading ? (
              <Skeleton className="h-6 w-8 mx-auto mt-1" />
            ) : (
              <p className="text-2xl font-bold text-blue-800">{stats?.totalMerchants || 0}</p>
            )}
            <p className="text-xs text-blue-600">
              {loading ? <Skeleton className="h-3 w-16 mx-auto" /> : `+${stats?.monthlyGrowth.merchants || 0} this month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900">Active Users</h3>
            {loading ? (
              <Skeleton className="h-6 w-8 mx-auto mt-1" />
            ) : (
              <p className="text-2xl font-bold text-green-800">{stats?.activeMerchants || 0}</p>
            )}
            <p className="text-xs text-green-600">All merchants active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-900">Total Returns</h3>
            {loading ? (
              <Skeleton className="h-6 w-12 mx-auto mt-1" />
            ) : (
              <p className="text-2xl font-bold text-purple-800">{totalReturns}</p>
            )}
            <p className="text-xs text-purple-600">
              {loading ? <Skeleton className="h-3 w-16 mx-auto" /> : `+${stats?.monthlyGrowth.returns || 0} this month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-orange-900">Total Revenue</h3>
            {loading ? (
              <Skeleton className="h-6 w-16 mx-auto mt-1" />
            ) : (
              <p className="text-2xl font-bold text-orange-800">{formatCurrency(totalRevenue)}</p>
            )}
            <p className="text-xs text-orange-600">
              {loading ? <Skeleton className="h-3 w-20 mx-auto" /> : `+${formatCurrency(stats?.monthlyGrowth.revenue || 0)} this month`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Merchants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            All Merchants
          </CardTitle>
          <CardDescription>
            Overview of all registered merchants and their activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-32 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : merchants.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No merchants found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {merchants.map((merchant) => (
                <div key={merchant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {merchant.shop_domain.replace('.myshopify.com', '')}
                      </h4>
                      <p className="text-sm text-slate-600">{merchant.shop_domain}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor('active')}>
                          active
                        </Badge>
                        <Badge variant="outline" className={getPlanColor(merchant.plan_type || 'starter')}>
                          {merchant.plan_type || 'starter'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Returns:</span>
                        <span className="font-semibold ml-1">{merchant.returnsCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Revenue:</span>
                        <span className="font-semibold ml-1">{formatCurrency(merchant.totalRevenue || 0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>Last active: {getTimeAgo(merchant.updated_at)}</span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantsTab;