
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const MetricsChart = () => {
  const returnsData = [
    { month: 'Jan', returns: 120, exchanges: 82, refunds: 38 },
    { month: 'Feb', returns: 145, exchanges: 98, refunds: 47 },
    { month: 'Mar', returns: 168, exchanges: 115, refunds: 53 },
    { month: 'Apr', returns: 192, exchanges: 134, refunds: 58 },
    { month: 'May', returns: 234, exchanges: 162, refunds: 72 },
    { month: 'Jun', returns: 287, exchanges: 198, refunds: 89 }
  ];

  const reasonsData = [
    { name: 'Wrong Size', value: 35, color: '#3B82F6' },
    { name: 'Defective', value: 25, color: '#EF4444' },
    { name: 'Not as Described', value: 20, color: '#F59E0B' },
    { name: 'Changed Mind', value: 15, color: '#10B981' },
    { name: 'Other', value: 5, color: '#6B7280' }
  ];

  const aiPerformanceData = [
    { week: 'Week 1', accuracy: 78, acceptance: 65 },
    { week: 'Week 2', accuracy: 82, acceptance: 71 },
    { week: 'Week 3', accuracy: 85, acceptance: 76 },
    { week: 'Week 4', accuracy: 88, acceptance: 82 }
  ];

  return (
    <div className="grid gap-6">
      {/* Returns Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Returns Trend</CardTitle>
          <CardDescription>Monthly returns, exchanges, and refunds over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={returnsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Return Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Return Reasons</CardTitle>
            <CardDescription>Breakdown of why customers return items</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={reasonsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {reasonsData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Performance */}
        <Card>
          <CardHeader>
            <CardTitle>AI Performance</CardTitle>
            <CardDescription>AI accuracy and merchant acceptance rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={aiPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#8B5CF6" name="AI Accuracy %" />
                <Bar dataKey="acceptance" fill="#06B6D4" name="Acceptance Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricsChart;
