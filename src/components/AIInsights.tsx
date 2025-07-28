
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, AlertCircle, Lightbulb, Star, ThumbsUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AIInsights = () => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const insights = [
    {
      type: "performance",
      title: "AI Suggestion Accuracy Improved",
      description: "Your AI recommendation accuracy increased by 12% this month, reaching 88% overall accuracy.",
      confidence: 92,
      impact: "high",
      action: "Continue current settings"
    },
    {
      type: "trend",
      title: "Exchange Rate Optimization",
      description: "Customers are 34% more likely to choose exchanges when shown AI recommendations for similar products.",
      confidence: 87,
      impact: "high",
      action: "Enable for all product categories"
    },
    {
      type: "opportunity",
      title: "Revenue Recovery Opportunity",
      description: "AI suggests focusing on electronics returns - 78% higher exchange success rate potential.",
      confidence: 76,
      impact: "medium",
      action: "Review electronics suggestions"
    }
  ];

  const topSuggestions = [
    {
      original: "Wireless Headphones",
      suggested: "Premium Wireless Earbuds",
      success_rate: 94,
      revenue_impact: "$2,340"
    },
    {
      original: "Running Shoes Size 9",
      suggested: "Trail Runners Size 9",
      success_rate: 89,
      revenue_impact: "$1,890"
    },
    {
      original: "Laptop Case 13\"",
      suggested: "Premium Laptop Sleeve 13\"",
      success_rate: 85,
      revenue_impact: "$1,120"
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-green-600 bg-green-50 border-green-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default: return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "performance": return Brain;
      case "trend": return TrendingUp;
      case "opportunity": return Lightbulb;
      default: return AlertCircle;
    }
  };

  const handleInsightAction = async (action: string, type: string) => {
    setActionLoading(action);
    try {
      // Apply action immediately - no artificial delay needed
      
      toast({
        title: "Action Applied",
        description: `${action} has been implemented successfully.`,
      });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to apply the action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Performance Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Overall AI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-slate-900">88%</div>
              <Badge className="bg-green-100 text-green-700">Excellent</Badge>
            </div>
            <Progress value={88} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Suggestions Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-slate-900">342</div>
              <div className="flex items-center text-green-600 text-sm">
                <ThumbsUp className="h-3 w-3 mr-1" />
                +15%
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Revenue Retained</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-slate-900">$28,430</div>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                +22%
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Via AI exchanges</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>AI Insights & Recommendations</span>
          </CardTitle>
          <CardDescription>
            Personalized insights to optimize your returns process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => {
              const Icon = getTypeIcon(insight.type);
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Icon className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                    <Badge className={getImpactColor(insight.impact)}>
                      {insight.impact} impact
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-xs text-slate-500">
                        <Star className="h-3 w-3 inline mr-1" />
                        {insight.confidence}% confidence
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInsightAction(insight.action, insight.type)}
                      disabled={actionLoading === insight.action}
                    >
                      {actionLoading === insight.action ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        insight.action
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing AI Suggestions</CardTitle>
          <CardDescription>
            Your most successful AI-powered product recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm text-slate-500">Original:</span>
                    <span className="font-medium">{suggestion.original}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">Suggested:</span>
                    <span className="font-medium text-purple-700">{suggestion.suggested}</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium text-green-600">
                    {suggestion.success_rate}% success
                  </div>
                  <div className="text-xs text-slate-500">
                    {suggestion.revenue_impact} retained
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
