import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, TrendingUp, Users, DollarSign } from "lucide-react";

const ReportsTab = () => {
  const reportTypes = [
    {
      id: 1,
      title: 'Monthly Returns Summary',
      description: 'Comprehensive overview of all returns processed this month',
      type: 'summary',
      frequency: 'Monthly',
      lastGenerated: '2 days ago',
      size: '2.4 MB'
    },
    {
      id: 2,
      title: 'Merchant Performance Report',
      description: 'Performance metrics and analytics for all merchants',
      type: 'performance',
      frequency: 'Weekly',
      lastGenerated: '1 day ago',
      size: '1.8 MB'
    },
    {
      id: 3,
      title: 'Financial Analytics Report',
      description: 'Revenue impact analysis and financial summaries',
      type: 'financial',
      frequency: 'Monthly',
      lastGenerated: '5 days ago',
      size: '3.2 MB'
    },
    {
      id: 4,
      title: 'System Usage Report',
      description: 'Platform usage statistics and user engagement metrics',
      type: 'usage',
      frequency: 'Weekly',
      lastGenerated: '3 hours ago',
      size: '1.1 MB'
    }
  ];

  const quickStats = [
    { name: 'Total Reports Generated', value: '1,247', icon: FileText, color: 'blue' },
    { name: 'Active Merchants', value: '4', icon: Users, color: 'green' },
    { name: 'Revenue This Month', value: '$30,250', icon: DollarSign, color: 'purple' },
    { name: 'Returns Processed', value: '346', icon: TrendingUp, color: 'orange' },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'summary': return 'text-blue-600 bg-blue-100';
      case 'performance': return 'text-green-600 bg-green-100';
      case 'financial': return 'text-purple-600 bg-purple-100';
      case 'usage': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'purple': return 'text-purple-600';
      case 'orange': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-600">Generate and download comprehensive system reports</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.name} className="bg-gradient-to-br from-white to-slate-50/50">
              <CardContent className="p-4 text-center">
                <IconComponent className={`h-8 w-8 mx-auto mb-2 ${getIconColor(stat.color)}`} />
                <h3 className="font-semibold text-slate-900 text-sm">{stat.name}</h3>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quick Report Generation
            </CardTitle>
            <CardDescription>
              Generate instant reports for current data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="justify-start gap-2 h-12">
                <Download className="h-4 w-4" />
                Generate Returns Summary (Last 30 days)
              </Button>
              <Button variant="outline" className="justify-start gap-2 h-12">
                <Download className="h-4 w-4" />
                Generate Merchant Performance Report
              </Button>
              <Button variant="outline" className="justify-start gap-2 h-12">
                <Download className="h-4 w-4" />
                Generate Financial Analytics
              </Button>
              <Button variant="outline" className="justify-start gap-2 h-12">
                <Download className="h-4 w-4" />
                Generate System Usage Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Custom Date Range
            </CardTitle>
            <CardDescription>
              Generate reports for specific time periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  defaultValue="2024-01-01"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  defaultValue="2024-01-31"
                />
              </div>
            </div>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option>Select Report Type</option>
              <option>Returns Summary</option>
              <option>Merchant Performance</option>
              <option>Financial Analytics</option>
              <option>System Usage</option>
            </select>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Custom Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Reports
          </CardTitle>
          <CardDescription>
            Previously generated reports ready for download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportTypes.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{report.title}</h4>
                    <p className="text-sm text-slate-600 mb-1">{report.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(report.type)}>
                        {report.type}
                      </Badge>
                      <Badge variant="outline">
                        {report.frequency}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <div className="text-sm text-slate-600">
                    <div>Size: {report.size}</div>
                    <div>Generated: {report.lastGenerated}</div>
                  </div>
                  <Button size="sm" variant="outline">
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
  );
};

export default ReportsTab;