
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MasterAdminLayout from "@/components/MasterAdminLayout";
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign, Activity, BarChart3 } from "lucide-react";

const SystemReportsPage = () => {
  const reports = [
    { 
      name: "Monthly Revenue Report", 
      description: "Comprehensive revenue analytics across all merchants",
      lastGenerated: "2 hours ago",
      size: "2.4 MB",
      type: "Financial"
    },
    { 
      name: "User Activity Summary", 
      description: "Platform usage statistics and user engagement metrics",
      lastGenerated: "6 hours ago",
      size: "1.8 MB",
      type: "Analytics"
    },
    { 
      name: "System Performance Report", 
      description: "Infrastructure metrics and performance analytics",
      lastGenerated: "1 day ago",
      size: "3.2 MB",
      type: "Technical"
    },
    { 
      name: "Merchant Growth Analysis", 
      description: "New merchant onboarding and growth trends",
      lastGenerated: "3 days ago",
      size: "1.5 MB",
      type: "Business"
    }
  ];

  const getTypeColor = (type: string) => {
    const colors = {
      Financial: "bg-green-100 text-green-800",
      Analytics: "bg-blue-100 text-blue-800",
      Technical: "bg-purple-100 text-purple-800",
      Business: "bg-orange-100 text-orange-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <MasterAdminLayout 
      title="System Reports" 
      description="Generate and access comprehensive system analytics and reports"
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">248</div>
              <p className="text-xs text-muted-foreground">+12 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45.2k</div>
              <p className="text-xs text-muted-foreground">+8.2% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Returns</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,429</div>
              <p className="text-xs text-muted-foreground">+5.4% this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.8%</div>
              <p className="text-xs text-muted-foreground">Past 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Create custom reports for specific date ranges and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <DollarSign className="h-5 w-5" />
                <span>Revenue Report</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Users className="h-5 w-5" />
                <span>User Analytics</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Activity className="h-5 w-5" />
                <span>System Health</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>Growth Analysis</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Reports
            </CardTitle>
            <CardDescription>
              Download and view previously generated reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {report.lastGenerated}
                        </span>
                        <span className="text-xs text-muted-foreground">{report.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getTypeColor(report.type)}>{report.type}</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MasterAdminLayout>
  );
};

export default SystemReportsPage;
