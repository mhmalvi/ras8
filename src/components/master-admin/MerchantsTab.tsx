import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Users, TrendingUp, Clock, MoreHorizontal } from "lucide-react";

const MerchantsTab = () => {
  const merchants = [
    { id: 1, name: 'Fashion Forward Store', domain: 'fashionforward.myshopify.com', plan: 'Pro', status: 'active', returns: 156, revenue: '$12,450', lastActive: '2 hours ago' },
    { id: 2, name: 'Tech Gadgets Plus', domain: 'techgadgets.myshopify.com', plan: 'Growth', status: 'active', returns: 89, revenue: '$8,920', lastActive: '30 minutes ago' },
    { id: 3, name: 'Home & Garden Co', domain: 'homegarden.myshopify.com', plan: 'Starter', status: 'active', returns: 34, revenue: '$3,200', lastActive: '1 day ago' },
    { id: 4, name: 'Sports Outlet', domain: 'sportsoutlet.myshopify.com', plan: 'Pro', status: 'trial', returns: 67, revenue: '$5,680', lastActive: '4 hours ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trial': return 'text-blue-600 bg-blue-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Pro': return 'text-purple-600 bg-purple-100';
      case 'Growth': return 'text-blue-600 bg-blue-100';
      case 'Starter': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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
            <p className="text-2xl font-bold text-blue-800">4</p>
            <p className="text-xs text-blue-600">+12% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900">Active Users</h3>
            <p className="text-2xl font-bold text-green-800">4</p>
            <p className="text-xs text-green-600">All merchants active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-900">Total Returns</h3>
            <p className="text-2xl font-bold text-purple-800">346</p>
            <p className="text-xs text-purple-600">+8% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-orange-900">Total Revenue</h3>
            <p className="text-2xl font-bold text-orange-800">$30,250</p>
            <p className="text-xs text-orange-600">+15% this month</p>
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
          <div className="space-y-4">
            {merchants.map((merchant) => (
              <div key={merchant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{merchant.name}</h4>
                    <p className="text-sm text-slate-600">{merchant.domain}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(merchant.status)}>
                        {merchant.status}
                      </Badge>
                      <Badge variant="outline" className={getPlanColor(merchant.plan)}>
                        {merchant.plan}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Returns:</span>
                      <span className="font-semibold ml-1">{merchant.returns}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Revenue:</span>
                      <span className="font-semibold ml-1">{merchant.revenue}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>Last active: {merchant.lastActive}</span>
                  </div>
                </div>

                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantsTab;