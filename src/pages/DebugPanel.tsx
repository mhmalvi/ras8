import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { useLiveData } from "@/hooks/useLiveData";
import { useProfile } from "@/hooks/useProfile";
import { useRealReturnsData } from "@/hooks/useRealReturnsData";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bug, 
  Database, 
  RefreshCw, 
  User, 
  ShoppingCart, 
  Brain,
  Activity,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

const DebugPanel = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { loading: liveDataLoading, error: liveDataError, dashboardKPIs, analyticsData, aiInsights, refreshAllData } = useLiveData();
  const { returns, loading: returnsLoading, error: returnsError } = useRealReturnsData();
  const [rawData, setRawData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
  };

  const handleDumpTableData = async (tableName: string) => {
    try {
      console.log(`🔍 Dumping ${tableName} table data...`);
      
      const validTables = ['merchants', 'profiles', 'returns', 'return_items', 'ai_suggestions', 'analytics_events', 'orders', 'billing_records'] as const;
      
      if (!validTables.includes(tableName as any)) {
        console.error(`❌ Invalid table name: ${tableName}`);
        return;
      }
      
      let query = supabase.from(tableName as any).select('*');
      
      // Add merchant filter for relevant tables
      if (['returns', 'analytics_events'].includes(tableName) && profile?.merchant_id) {
        query = (query as any).eq('merchant_id', profile.merchant_id);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) {
        console.error(`❌ Error fetching ${tableName}:`, error);
        return;
      }
      
      console.table(data);
      setRawData({ table: tableName, data, count: data?.length || 0 });
    } catch (error) {
      console.error(`❌ Failed to dump ${tableName}:`, error);
    }
  };

  const getStatusIcon = (isLoading: boolean, hasError: boolean) => {
    if (isLoading) return <Activity className="h-4 w-4 text-yellow-500 animate-spin" />;
    if (hasError) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const tableQueries = [
    'merchants',
    'profiles', 
    'returns',
    'return_items',
    'ai_suggestions',
    'analytics_events',
    'orders',
    'billing_records'
  ];

  return (
    <AppLayout 
      title="🧪 Debug Panel" 
      description="Development debugging and data inspection"
    >
      <div className="space-y-6">
        {/* System Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current system state and data loading status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Profile</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(profileLoading, !profile)}
                  <Badge variant={profile ? "default" : "destructive"}>
                    {profile ? "Loaded" : "Missing"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm">Returns Data</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(returnsLoading, !!returnsError)}
                  <Badge variant={returnsError ? "destructive" : "default"}>
                    {returns.length} items
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="text-sm">Live Data</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(liveDataLoading, !!liveDataError)}
                  <Badge variant={liveDataError ? "destructive" : "default"}>
                    {liveDataError ? "Error" : "Active"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex gap-2">
              <Button 
                onClick={handleRefreshData} 
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="data">Live Data</TabsTrigger>
            <TabsTrigger value="tables">Raw Tables</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          {/* Profile Debug */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Data Debug */}
          <TabsContent value="data" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard KPIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(dashboardKPIs, null, 2)}
                  </pre>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(analyticsData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(aiInsights, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Raw Tables Debug */}
          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Tables
                </CardTitle>
                <CardDescription>
                  Click to dump table data to console and view here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {tableQueries.map((table) => (
                    <Button
                      key={table}
                      onClick={() => handleDumpTableData(table)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {table}
                    </Button>
                  ))}
                </div>
                
                {rawData && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{rawData.table}</h4>
                      <Badge>{rawData.count} records</Badge>
                    </div>
                    <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
                      {JSON.stringify(rawData.data, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Errors Debug */}
          <TabsContent value="errors" className="space-y-4">
            <div className="grid gap-4">
              {liveDataError && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-700">Live Data Error</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600 text-sm">{liveDataError}</p>
                  </CardContent>
                </Card>
              )}
              
              {returnsError && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-700">Returns Data Error</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600 text-sm">{returnsError}</p>
                  </CardContent>
                </Card>
              )}
              
              {!liveDataError && !returnsError && (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>No errors detected</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Debug Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• Check browser console for detailed logs and table dumps</p>
            <p>• Use "Raw Tables" to inspect actual database content</p>
            <p>• "Live Data" shows processed analytics and KPIs</p>
            <p>• Profile tab shows current user session state</p>
            <p>• Refresh data to force re-fetch from database</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DebugPanel;
