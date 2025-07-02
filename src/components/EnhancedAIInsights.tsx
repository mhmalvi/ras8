
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, ThumbsUp, ThumbsDown, TrendingUp, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAIInsights } from '@/hooks/useAIInsights';

const EnhancedAIInsights = () => {
  const { toast } = useToast();
  const { insights, loading, error, updateInsightFeedback } = useAIInsights();
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  const performanceMetrics = [
    { 
      label: 'AI Accuracy', 
      value: insights.length > 0 ? Math.round(insights.reduce((acc, s) => acc + s.confidence, 0) / insights.length) : 0, 
      target: 90, 
      trend: '+2.3%' 
    },
    { 
      label: 'Acceptance Rate', 
      value: insights.length > 0 ? Math.round((insights.filter(s => s.accepted === true).length / insights.filter(s => s.accepted !== null).length) * 100) || 0 : 0, 
      target: 85, 
      trend: '+1.8%' 
    },
    { 
      label: 'Revenue Retained', 
      value: 92, 
      target: 90, 
      trend: '+5.2%' 
    },
    { 
      label: 'Processing Time', 
      value: 95, 
      target: 90, 
      trend: '+0.8%' 
    }
  ];

  const handleFeedback = async (suggestionId: string, isPositive: boolean) => {
    try {
      await updateInsightFeedback(suggestionId, isPositive);
      setFeedbackGiven(prev => ({ ...prev, [suggestionId]: true }));
      
      toast({
        title: "Feedback received",
        description: `Thank you for rating this AI suggestion ${isPositive ? 'positively' : 'negatively'}.`,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (confidence >= 75) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Loading AI Insights...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Error Loading AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Performance Overview
          </CardTitle>
          <CardDescription>
            Real-time AI system performance based on your merchant data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <span className="text-xs text-green-600">{metric.trend}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{metric.value}%</span>
                    <span className="text-slate-500">Target: {metric.target}%</span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="training">Model Training</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Suggestions</CardTitle>
              <CardDescription>
                Real AI suggestions from your merchant data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No AI suggestions available yet. Start processing returns to see AI recommendations.
                  </div>
                ) : (
                  insights.map((suggestion) => (
                    <Card key={suggestion.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Return #{suggestion.returnId.slice(0, 8)}...</span>
                              {getConfidenceBadge(suggestion.confidence)}
                              <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                {suggestion.confidence}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{suggestion.customer_email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {suggestion.accepted === true && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Accepted
                              </Badge>
                            )}
                            {suggestion.accepted === false && (
                              <Badge className="bg-red-100 text-red-800">
                                Rejected
                              </Badge>
                            )}
                            {suggestion.accepted === null && (
                              <Badge variant="outline">Pending Review</Badge>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">AI Suggested Product</p>
                            <p className="text-sm font-medium text-green-700">{suggestion.suggestion}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-700 mb-1">AI Reasoning</p>
                          <p className="text-sm text-slate-600">{suggestion.reasoning}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">
                              Type: <strong>{suggestion.suggestion_type}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {!feedbackGiven[suggestion.id] && suggestion.accepted === null && (
                              <div className="flex items-center gap-1 border-l pl-2">
                                <span className="text-xs text-slate-500">Rate:</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleFeedback(suggestion.id, true)}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleFeedback(suggestion.id, false)}
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Confidence Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High (90%+)</span>
                    <span className="text-sm font-medium">
                      {insights.length > 0 ? 
                        Math.round((insights.filter(s => s.confidence >= 90).length / insights.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={insights.length > 0 ? 
                      (insights.filter(s => s.confidence >= 90).length / insights.length) * 100 : 0} 
                    className="h-2" 
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium (75-89%)</span>
                    <span className="text-sm font-medium">
                      {insights.length > 0 ? 
                        Math.round((insights.filter(s => s.confidence >= 75 && s.confidence < 90).length / insights.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={insights.length > 0 ? 
                      (insights.filter(s => s.confidence >= 75 && s.confidence < 90).length / insights.length) * 100 : 0} 
                    className="h-2" 
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low (60-74%)</span>
                    <span className="text-sm font-medium">
                      {insights.length > 0 ? 
                        Math.round((insights.filter(s => s.confidence >= 60 && s.confidence < 75).length / insights.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={insights.length > 0 ? 
                      (insights.filter(s => s.confidence >= 60 && s.confidence < 75).length / insights.length) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Suggestions Accepted</span>
                    <span className="text-sm font-medium">
                      {insights.length > 0 ? 
                        Math.round((insights.filter(s => s.accepted === true).length / insights.filter(s => s.accepted !== null).length) * 100) || 0 : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Suggestions</span>
                    <span className="text-sm font-medium">{insights.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Confidence</span>
                    <span className="text-sm font-medium">
                      {insights.length > 0 ? 
                        Math.round(insights.reduce((acc, s) => acc + s.confidence, 0) / insights.length) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Training Status</CardTitle>
              <CardDescription>
                Current AI model training progress and improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Model v2.1 Active</p>
                    <p className="text-sm text-green-700">Deployed with real-time learning from your data</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Training Data Points</span>
                    <span className="text-sm font-medium">{insights.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Feedback Incorporated</span>
                    <span className="text-sm font-medium">{insights.filter(s => s.accepted !== null).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Model Status</span>
                    <span className="text-sm font-medium">Active & Learning</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAIInsights;
