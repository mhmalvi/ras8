
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
      // Simulate AI recommendation generation
      const mockRecommendations: RecommendationResult[] = [
        {
          id: '1',
          type: 'product_exchange',
          title: 'Smart Exchange Opportunity',
          description: 'Customer returned size M shirt - AI suggests size L alternative with 94% confidence',
          confidence: 94,
          impact: 'high',
          expectedRevenue: 85,
          customerRetentionScore: 92,
          reasoning: 'Size-related returns have 94% success rate when offering next size up. Customer history shows preference for this brand.',
          actions: ['Offer size L exchange', 'Include size guide', 'Add 10% discount for inconvenience']
        },
        {
          id: '2',
          type: 'retention_offer',
          title: 'Customer Retention Strategy',
          description: 'High-value customer showing return pattern - AI recommends personalized retention offer',
          confidence: 87,
          impact: 'high',
          expectedRevenue: 320,
          customerRetentionScore: 85,
          reasoning: 'Customer has $1,200 lifetime value but 3 returns in 2 months. Retention offer could prevent churn.',
          actions: ['Offer 15% store credit', 'Personal stylist consultation', 'VIP customer status']
        },
        {
          id: '3',
          type: 'store_credit',
          title: 'Store Credit Optimization',
          description: 'Quality concern return - AI suggests store credit with bonus to maintain relationship',
          confidence: 79,
          impact: 'medium',
          expectedRevenue: 45,
          customerRetentionScore: 78,
          reasoning: 'Quality issues often result in brand loyalty loss. Store credit with 20% bonus shows commitment to customer satisfaction.',
          actions: ['Offer 120% store credit', 'Quality assurance follow-up', 'Product improvement feedback']
        }
      ];

      setRecommendations(mockRecommendations);
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
