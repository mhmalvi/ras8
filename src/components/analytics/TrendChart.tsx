
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface TrendChartProps {
  title: string;
  data: Array<{
    period: string;
    returns: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  type?: 'line' | 'bar';
}

export const TrendChart = ({ title, data, type = 'line' }: TrendChartProps) => {
  const ChartComponent = type === 'line' ? LineChart : BarChart;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis 
                dataKey="period" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              {type === 'line' ? (
                <Line 
                  type="monotone" 
                  dataKey="returns" 
                  stroke="#1D4ED8" 
                  strokeWidth={2}
                  dot={{ fill: '#1D4ED8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#1D4ED8' }}
                />
              ) : (
                <Bar 
                  dataKey="returns" 
                  fill="#1D4ED8" 
                  radius={[4, 4, 0, 0]}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
