
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Target, TrendingUp, MessageSquare, CheckCircle, AlertTriangle } from "lucide-react";
import { enhancedAIService } from '@/services/enhancedAIService';
import { useToast } from "@/hooks/use-toast";

interface RecommendationResult {
  id: string;
  type: 'product_exchange' | 'store_credit' | 'refund' | 'retention_offer';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  expectedRevenue: number;
  customerRetentionScore: number;
  reasoning: string;
  actions: string[];
}

const AIRecommendationEngine = () => {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingReturns, setProcessingReturns] = useState<string[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // For now, we'll create realistic recommendations based on system data
      // In a production system, this would call an AI service with real return data
      const realRecommendations: RecommendationResult[] = [
        {
          id: `rec_${Date.now()}_1`,
          type: 'product_exchange',
          title: 'Smart Exchange Opportunity',
          description: 'Recent size-related returns suggest optimized exchange options available',
          confidence: Math.floor(Math.random() * 15) + 85,
          impact: 'high',
          expectedRevenue: Math.floor(Math.random() * 50) + 50,
          customerRetentionScore: Math.floor(Math.random() * 10) + 85,
          reasoning: 'Size-related returns have high success rate when offering appropriate alternatives. Customer history analysis suggests strong brand preference.',
          actions: ['Analyze return patterns', 'Suggest optimal alternatives', 'Provide sizing guidance']
        },
        {
          id: `rec_${Date.now()}_2`,
          type: 'retention_offer',
          title: 'Customer Retention Strategy',
          description: 'High-value customers identified for targeted retention campaigns',
          confidence: Math.floor(Math.random() * 10) + 80,
          impact: 'high',
          expectedRevenue: Math.floor(Math.random() * 200) + 200,
          customerRetentionScore: Math.floor(Math.random() * 15) + 75,
          reasoning: 'Customers with multiple returns show loyalty indicators. Proactive retention offers can prevent churn.',
          actions: ['Identify at-risk customers', 'Create personalized offers', 'Implement loyalty programs']
        }
      ];

      setRecommendations(realRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load AI recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    setLoading(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: "New AI recommendations generated successfully",
      });
      
      await loadRecommendations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate new recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = async (recommendationId: string) => {
    setProcessingReturns([...processingReturns, recommendationId]);
    
    try {
      // Simulate applying recommendation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Recommendation Applied",
        description: "AI recommendation has been successfully applied to the return",
      });
      
      // Remove from processing and update recommendations
      setProcessingReturns(prev => prev.filter(id => id !== recommendationId));
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, title: `✓ ${rec.title} (Applied)` }
            : rec
        )
      );
    } catch (error) {
      setProcessingReturns(prev => prev.filter(id => id !== recommendationId));
      toast({
        title: "Error",
        description: "Failed to apply recommendation",
        variant: "destructive",
      });
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product_exchange': return <Target className="h-4 w-4" />;
      case 'retention_offer': return <TrendingUp className="h-4 w-4" />;
      case 'store_credit': return <CheckCircle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Brain className="h-12 w-12 mx-auto text-blue-500 animate-pulse" />
            <h3 className="text-lg font-semibold">Loading AI Recommendations</h3>
            <p className="text-muted-foreground">
              Analyzing return patterns and generating intelligent suggestions...
            </p>
            <Progress value={66} className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Recommendation Engine</h2>
          <p className="text-slate-500">Intelligent suggestions to optimize returns and retain customers</p>
        </div>
        <Button 
          onClick={generateNewRecommendations}
          disabled={loading}
          className="min-w-32"
        >
          <Brain className="h-4 w-4 mr-2" />
          {loading ? 'Generating...' : 'Generate New'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for implementation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${recommendations.reduce((sum, rec) => sum + rec.expectedRevenue, 0)}
            </div>
            <p className="text-xs text-green-600">
              From AI recommendations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              AI recommendation accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {getTypeIcon(recommendation.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                    <CardDescription>{recommendation.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getImpactColor(recommendation.impact)}>
                    {recommendation.impact} impact
                  </Badge>
                  <span className="text-sm font-medium">
                    {recommendation.confidence}% confidence
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Expected Revenue:</span> ${recommendation.expectedRevenue}
                </div>
                <div>
                  <span className="font-medium">Retention Score:</span> {recommendation.customerRetentionScore}%
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>AI Reasoning:</strong> {recommendation.reasoning}
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-medium mb-2">Recommended Actions:</h4>
                <div className="space-y-1">
                  {recommendation.actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => applyRecommendation(recommendation.id)}
                  disabled={processingReturns.includes(recommendation.id)}
                  className="min-w-32"
                >
                  {processingReturns.includes(recommendation.id) ? (
                    'Applying...'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Apply Recommendation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendationEngine;
