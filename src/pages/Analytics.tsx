
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Download, Calendar, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { useToast } from "@/hooks/use-toast";

const Analytics = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("returns");

  // Mock data for different time ranges
  const timeRangeData = {
    "7d": [
      { day: 'Mon', returns: 23, exchanges: 16, refunds: 7, revenue: 1250 },
      { day: 'Tue', returns: 31, exchanges: 22, refunds: 9, revenue: 1680 },
      { day: 'Wed', returns: 28, exchanges: 19, refunds: 9, revenue: 1420 },
      { day: 'Thu', returns: 35, exchanges: 24, refunds: 11, revenue: 1890 },
      { day: 'Fri', returns: 42, exchanges: 29, refunds: 13, revenue: 2210 },
      { day: 'Sat', returns: 38, exchanges: 26, refunds: 12, revenue: 1980 },
      { day: 'Sun', returns: 25, exchanges: 17, refunds: 8, revenue: 1340 }
    ],
    "30d": [
      { month: 'Week 1', returns: 180, exchanges: 126, refunds: 54, revenue: 9800 },
      { month: 'Week 2', returns: 220, exchanges: 154, refunds: 66, revenue: 12100 },
      { month: 'Week 3', returns: 195, exchanges: 137, refunds: 58, revenue: 10650 },
      { month: 'Week 4', returns: 245, exchanges: 172, refunds: 73, revenue: 13200 }
    ],
    "90d": [
      { quarter: 'Month 1', returns: 850, exchanges: 595, refunds: 255, revenue: 46200 },
      { quarter: 'Month 2', returns: 920, exchanges: 644, refunds: 276, revenue: 50100 },
      { quarter: 'Month 3', returns: 1050, exchanges: 735, refunds: 315, revenue: 57300 }
    ]
  };

  const reasonBreakdown = [
    { name: 'Wrong Size', value: 35, color: '#3B82F6', count: 1247 },
    { name: 'Defective', value: 25, color: '#EF4444', count: 891 },
    { name: 'Not as Described', value: 20, color: '#F59E0B', count: 712 },
    { name: 'Changed Mind', value: 15, color: '#10B981', count: 534 },
    { name: 'Other', value: 5, color: '#6B7280', count: 178 }
  ];

  const aiPerformanceData = [
    { week: 'Week 1', accuracy: 78, acceptance: 65, suggestions: 145 },
    { week: 'Week 2', accuracy: 82, acceptance: 71, suggestions: 167 },
    { week: 'Week 3', accuracy: 85, acceptance: 76, suggestions: 189 },
    { week: 'Week 4', accuracy: 88, acceptance: 82, suggestions: 203 }
  ];

  const handleExportReport = () => {
    // This will be connected to actual data export when database is synced
    toast({
      title: "Report exported",
      description: "Analytics report has been downloaded as CSV file."
    });
  };

  const handleSyncData = () => {
    // This will trigger actual database sync
    toast({
      title: "Data synced",
      description: "Latest data has been synchronized from the database."
    });
  };

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
                  <h1 className="text-xl font-semibold text-slate-900">Analytics & Reports</h1>
                  <p className="text-sm text-slate-500">Detailed insights and performance metrics</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleSyncData}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Sync Data
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Key Metrics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Total Returns</p>
                        <p className="text-2xl font-bold">2,847</p>
                        <p className="text-xs text-green-600 mt-1">+12.5% vs last period</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Exchange Rate</p>
                        <p className="text-2xl font-bold">68.2%</p>
                        <p className="text-xs text-green-600 mt-1">+5.2% vs last period</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Revenue Retained</p>
                        <p className="text-2xl font-bold">$45,230</p>
                        <p className="text-xs text-green-600 mt-1">+18.7% vs last period</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">AI Accuracy</p>
                        <p className="text-2xl font-bold">88%</p>
                        <p className="text-xs text-green-600 mt-1">+2.1% vs last period</p>
                      </div>
                      <PieChart className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analytics Charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Returns Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Returns Trend Analysis</CardTitle>
                    <CardDescription>Detailed breakdown of returns over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeRangeData[timeRange as keyof typeof timeRangeData]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={timeRange === "7d" ? "day" : timeRange === "30d" ? "month" : "quarter"} />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="returns" 
                          stroke="#1D4ED8" 
                          strokeWidth={2}
                          name="Total Returns"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="exchanges" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Exchanges"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="refunds" 
                          stroke="#EF4444" 
                          strokeWidth={2}
                          name="Refunds"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Return Reasons Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Return Reasons Analysis</CardTitle>
                    <CardDescription>Why customers are returning items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={reasonBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {reasonBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {reasonBreakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{item.value}%</span>
                            <span className="text-slate-500 ml-2">({item.count})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Performance Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Performance Deep Dive</CardTitle>
                  <CardDescription>Detailed analysis of AI recommendation performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={aiPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="accuracy" fill="#8B5CF6" name="AI Accuracy %" />
                      <Bar dataKey="acceptance" fill="#06B6D4" name="Merchant Acceptance %" />
                      <Bar dataKey="suggestions" fill="#F59E0B" name="Total Suggestions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue Impact Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Impact Analysis</CardTitle>
                  <CardDescription>How returns automation affects your bottom line</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Revenue Saved</h4>
                      <div className="text-3xl font-bold text-green-600">$45,230</div>
                      <p className="text-sm text-slate-500">Through exchange conversions this month</p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Processing Time Saved</h4>
                      <div className="text-3xl font-bold text-blue-600">127 hrs</div>
                      <p className="text-sm text-slate-500">Automated processing vs manual</p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Customer Satisfaction</h4>
                      <div className="text-3xl font-bold text-purple-600">4.8/5</div>
                      <p className="text-sm text-slate-500">Average rating for return experience</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;
