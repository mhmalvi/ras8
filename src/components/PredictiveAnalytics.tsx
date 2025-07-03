
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, Target, Brain } from "lucide-react";
import { enhancedAIService } from '@/services/enhancedAIService';
import { useToast } from "@/hooks/use-toast";

interface TrendPrediction {
  category: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
}

interface SeasonalPattern {
  period: string;
  returnRate: number;
  predictedRate: number;
  factors: string[];
}

const PredictiveAnalytics = () => {
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<TrendPrediction[]>([]);
  const [seasonalData, setSeasonalData] = useState<SeasonalPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadPredictiveData();
  }, []);

  const loadPredictiveData = async () => {
    setLoading(true);
    try {
      // Simulate AI prediction generation
      const mockPredictions: TrendPrediction[] = [
        {
          category: 'Return Volume',
          currentValue: 12.5,
          predictedValue: 15.8,
          confidence: 89,
          trend: 'increasing',
          impact: 'high',
          timeframe: 'Next 30 days'
        },
        {
          category: 'Size-Related Returns',
          currentValue: 35.2,
          predictedValue: 28.7,
          confidence: 92,
          trend: 'decreasing',
          impact: 'medium',
          timeframe: 'Next 30 days'
        },
        {
          category: 'Quality Issues',
          currentValue: 18.3,
          predictedValue: 22.1,
          confidence: 78,
          trend: 'increasing',
          impact: 'high',
          timeframe: 'Next 30 days'
        },
        {
          category: 'AI Acceptance Rate',
          currentValue: 84.5,
          predictedValue: 91.2,
          confidence: 95,
          trend: 'increasing',
          impact: 'high',
          timeframe: 'Next 30 days'
        }
      ];

      const mockSeasonalData: SeasonalPattern[] = [
        {
          period: 'Jan',
          returnRate: 8.2,
          predictedRate: 9.1,
          factors: ['Holiday returns', 'Size exchanges']
        },
        {
          period: 'Feb',
          returnRate: 6.8,
          predictedRate: 7.2,
          factors: ['Valentine gifts', 'Winter clearance']
        },
        {
          period: 'Mar',
          returnRate: 9.5,
          predictedRate: 10.8,
          factors: ['Spring fashion', 'Size transitions']
        },
        {
          period: 'Apr',
          returnRate: 11.2,
          predictedRate: 12.5,
          factors: ['Spring cleaning', 'Color preferences']
        },
        {
          period: 'May',
          returnRate: 10.8,
          predictedRate: 11.9,
          factors: ['Mother\'s Day', 'Summer prep']
        },
        {
          period: 'Jun',
          returnRate: 13.5,
          predictedRate: 15.2,
          factors: ['Summer styles', 'Vacation prep']
        }
      ];

      setPredictions(mockPredictions);
      setSeasonalData(mockSeasonalData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading predictive data:', error);
      toast({
        title: "Error",
        description: "Failed to load predictive analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPredictions = async () => {
    setLoading(true);
    try {
      // Simulate refreshing predictions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: "Predictive analytics updated successfully",
      });
      
      await loadPredictiveData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh predictions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-red-600';
      case 'decreasing': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">High Impact</Badge>;
      case 'medium': return <Badge variant="secondary">Medium Impact</Badge>;
      case 'low': return <Badge variant="outline">Low Impact</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading && predictions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Brain className="h-12 w-12 mx-auto text-blue-500 animate-pulse" />
            <h3 className="text-lg font-semibold">Generating Predictive Analytics</h3>
            <p className="text-muted-foreground">
              AI is analyzing historical patterns and forecasting trends...
            </p>
            <Progress value={75} className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Predictive Analytics</h2>
          <p className="text-slate-500">AI-powered forecasting and trend analysis</p>
          {lastUpdated && (
            <p className="text-xs text-slate-400 mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <Button 
          onClick={refreshPredictions}
          disabled={loading}
          className="min-w-32"
        >
          <Brain className="h-4 w-4 mr-2" />
          {loading ? 'Updating...' : 'Refresh Predictions'}
        </Button>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trend Predictions</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.map((prediction, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{prediction.category}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(prediction.trend)}
                      {getImpactBadge(prediction.impact)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="text-2xl font-bold">{prediction.currentValue}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Predicted</p>
                      <p className={`text-2xl font-bold ${getTrendColor(prediction.trend)}`}>
                        {prediction.predictedValue}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence Level</span>
                      <span>{prediction.confidence}%</span>
                    </div>
                    <Progress value={prediction.confidence} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{prediction.timeframe}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Change:</span>
                    <span className={getTrendColor(prediction.trend)}>
                      {prediction.trend === 'increasing' ? '+' : prediction.trend === 'decreasing' ? '-' : '±'}
                      {Math.abs(prediction.predictedValue - prediction.currentValue).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Return Patterns</CardTitle>
              <CardDescription>
                Historical vs predicted return rates by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="returnRate" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Historical Rate"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predictedRate" 
                    stackId="2" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    name="Predicted Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasonalData.map((period, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{period.period}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Historical:</span>
                    <span className="font-medium">{period.returnRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Predicted:</span>
                    <span className="font-medium text-blue-600">{period.predictedRate}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Key Factors:</p>
                    <div className="space-y-1">
                      {period.factors.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs mr-1">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Prediction Accuracy</CardTitle>
                <CardDescription>
                  Historical accuracy of AI predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Accurate', value: 87, color: '#00C49F' },
                        { name: 'Partially Accurate', value: 11, color: '#FFBB28' },
                        { name: 'Inaccurate', value: 2, color: '#FF8042' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: 'Accurate', value: 87, color: '#00C49F' },
                        { name: 'Partially Accurate', value: 11, color: '#FFBB28' },
                        { name: 'Inaccurate', value: 2, color: '#FF8042' }
                      ].map((entry, index) => (
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
                <CardTitle>Key AI Insights</CardTitle>
                <CardDescription>
                  Important patterns identified by AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Size Pattern Alert</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    Size-related returns declining by 18% due to improved product descriptions and size guides.
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">AI Success</span>
                  </div>
                  <p className="text-sm text-green-800">
                    AI recommendations showing 91% acceptance rate, up from 84% last month.
                  </p>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Quality Concern</span>
                  </div>
                  <p className="text-sm text-yellow-800">
                    Quality-related returns increasing in specific product categories. Investigation recommended.
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-900">Model Improvement</span>
                  </div>
                  <p className="text-sm text-purple-800">
                    AI model updated with 2,500 new data points. Prediction accuracy improved by 3.2%.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalytics;
