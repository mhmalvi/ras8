
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, ThumbsUp, ThumbsDown, TrendingUp, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const EnhancedAIInsights = () => {
  const { toast } = useToast();
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  const aiSuggestions = [
    {
      id: '1',
      returnId: 'RET-001',
      customerEmail: 'john@example.com',
      originalItem: 'Blue T-Shirt (Size L)',
      suggestedItem: 'Blue T-Shirt (Size XL)',
      confidence: 94,
      reasoning: 'Customer indicated size was too small. Same design in larger size available.',
      status: 'pending',
      potentialRevenue: 29.99
    },
    {
      id: '2',
      returnId: 'RET-002',
      customerEmail: 'sarah@example.com',
      originalItem: 'Red Dress (Size M)',
      suggestedItem: 'Black Dress (Size M)',
      confidence: 87,
      reasoning: 'Customer purchase history shows preference for darker colors. Similar style available.',
      status: 'accepted',
      potentialRevenue: 89.99
    },
    {
      id: '3',
      returnId: 'RET-003',
      customerEmail: 'mike@example.com',
      originalItem: 'Running Shoes (Size 10)',
      suggestedItem: 'Running Shoes (Size 10.5)',
      confidence: 76,
      reasoning: 'Size complaint common for this model. Half size up recommended by other customers.',
      status: 'pending',
      potentialRevenue: 129.99
    }
  ];

  const performanceMetrics = [
    { label: 'AI Accuracy', value: 88, target: 90, trend: '+2.3%' },
    { label: 'Acceptance Rate', value: 84, target: 85, trend: '+1.8%' },
    { label: 'Revenue Retained', value: 92, target: 90, trend: '+5.2%' },
    { label: 'Processing Time', value: 95, target: 90, trend: '+0.8%' }
  ];

  const handleFeedback = (suggestionId: string, isPositive: boolean) => {
    setFeedbackGiven(prev => ({ ...prev, [suggestionId]: true }));
    toast({
      title: "Feedback received",
      description: `Thank you for rating this AI suggestion ${isPositive ? 'positively' : 'negatively'}.`,
    });
  };

  const handleAcceptSuggestion = (suggestionId: string) => {
    toast({
      title: "Suggestion accepted",
      description: "The AI suggestion has been applied to the return.",
    });
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    toast({
      title: "Suggestion rejected",
      description: "The AI suggestion has been declined.",
    });
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

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Performance Overview
          </CardTitle>
          <CardDescription>
            Real-time AI system performance and accuracy metrics
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
                Review and provide feedback on AI-generated exchange recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Return #{suggestion.returnId}</span>
                            {getConfidenceBadge(suggestion.confidence)}
                            <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                              {suggestion.confidence}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{suggestion.customerEmail}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {suggestion.status === 'accepted' && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accepted
                            </Badge>
                          )}
                          {suggestion.status === 'pending' && (
                            <Badge variant="outline">Pending Review</Badge>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Original Item</p>
                            <p className="text-sm">{suggestion.originalItem}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Suggested Exchange</p>
                            <p className="text-sm font-medium text-green-700">{suggestion.suggestedItem}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-slate-700 mb-1">AI Reasoning</p>
                        <p className="text-sm text-slate-600">{suggestion.reasoning}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Potential revenue: <strong>${suggestion.potentialRevenue}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          {suggestion.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectSuggestion(suggestion.id)}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptSuggestion(suggestion.id)}
                              >
                                Accept
                              </Button>
                            </>
                          )}
                          
                          {!feedbackGiven[suggestion.id] && (
                            <div className="flex items-center gap-1 ml-2 border-l pl-2">
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
                ))}
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
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium (75-89%)</span>
                    <span className="text-sm font-medium">38%</span>
                  </div>
                  <Progress value={38} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low (60-74%)</span>
                    <span className="text-sm font-medium">17%</span>
                  </div>
                  <Progress value={17} className="h-2" />
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
                    <span className="text-sm font-medium">84%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="text-sm font-medium">91%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Revenue Retained</span>
                    <span className="text-sm font-medium">$12,450</span>
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
                    <p className="text-sm text-green-700">Deployed 2 days ago with 12% accuracy improvement</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Training Data Points</span>
                    <span className="text-sm font-medium">15,847</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Feedback Incorporated</span>
                    <span className="text-sm font-medium">1,203</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Next Training Cycle</span>
                    <span className="text-sm font-medium">In 5 days</span>
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
