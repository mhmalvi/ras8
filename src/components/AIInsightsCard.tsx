
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ThumbsUp, ThumbsDown, Brain, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const AIInsightsCard = () => {
  const { insights, loading, error, updateInsightFeedback } = useAIInsights();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFeedback = async (insightId: string, accepted: boolean) => {
    try {
      await updateInsightFeedback(insightId, accepted);
      toast({
        title: "Feedback recorded",
        description: accepted ? "Thanks for the positive feedback!" : "We'll improve our recommendations.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to record feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">High Match</Badge>;
    } else if (confidence >= 75) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Medium Match</Badge>;
    } else {
      return <Badge variant="secondary">Low Match</Badge>;
    }
  };

  // Show recent insights (top 3) for card view
  const recentInsights = insights.slice(0, 3);
  const acceptedInsights = insights.filter(i => i.accepted !== null);
  const acceptanceRate = acceptedInsights.length > 0 
    ? (insights.filter(i => i.accepted === true).length / acceptedInsights.length) * 100 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="ml-2 text-sm text-slate-600">Loading AI insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-red-600 text-sm mb-3">Failed to load AI insights</p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-background rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-medium text-foreground">AI Insights</h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{insights.length} recommendations</span>
          {acceptedInsights.length > 0 && (
            <div className="flex items-center gap-1 text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">
                {acceptanceRate.toFixed(0)}% accepted
              </span>
            </div>
          )}
        </div>
      </div>
      
      {recentInsights.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No AI recommendations yet. They'll appear as returns come in.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentInsights.map((insight) => (
            <div key={insight.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground mb-1">
                    {insight.suggestion}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {insight.reasoning}
                  </p>
                  {insight.customer_email && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Customer: {insight.customer_email}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  {getConfidenceBadge(insight.confidence)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {insight.confidence}% confidence
                </span>
                
                {insight.accepted === null && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => handleFeedback(insight.id, true)}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => handleFeedback(insight.id, false)}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {insight.accepted !== null && (
                  <Badge variant={insight.accepted ? "default" : "secondary"} className="text-xs">
                    {insight.accepted ? "Accepted" : "Declined"}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          
          {insights.length > 3 && (
            <div className="text-center pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/ai-insights')}
              >
                View all {insights.length} insights
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsightsCard;
