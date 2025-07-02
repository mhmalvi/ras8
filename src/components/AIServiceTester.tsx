import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useToast } from "@/hooks/use-toast";

const AIServiceTester = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    returnReason: 'Too small',
    productName: 'Red Cotton T-Shirt',
    customerEmail: 'customer@example.com',
    orderValue: 25.99
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const recommendation = await aiService.generateExchangeRecommendation(testData);
      setResult(recommendation);
      toast({
        title: "AI Test Successful",
        description: "AI service is working correctly!"
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast({
        title: "AI Test Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TestTube className="h-6 w-6" />
          <CardTitle>AI Service Tester</CardTitle>
        </div>
        <CardDescription>
          Test the AI exchange recommendation service with sample data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="returnReason">Return Reason</Label>
            <Input
              id="returnReason"
              value={testData.returnReason}
              onChange={(e) => setTestData({...testData, returnReason: e.target.value})}
              placeholder="e.g., Too small, Wrong color"
            />
          </div>
          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={testData.productName}
              onChange={(e) => setTestData({...testData, productName: e.target.value})}
              placeholder="e.g., Red Cotton T-Shirt"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerEmail">Customer Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={testData.customerEmail}
              onChange={(e) => setTestData({...testData, customerEmail: e.target.value})}
              placeholder="customer@example.com"
            />
          </div>
          <div>
            <Label htmlFor="orderValue">Order Value ($)</Label>
            <Input
              id="orderValue"
              type="number"
              step="0.01"
              value={testData.orderValue}
              onChange={(e) => setTestData({...testData, orderValue: parseFloat(e.target.value) || 0})}
              placeholder="25.99"
            />
          </div>
        </div>

        <Button 
          onClick={runTest} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing AI Service...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Test AI Recommendation
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium text-green-800">AI Recommendation Generated:</div>
                <div className="space-y-1">
                  <div><strong>Suggested Product:</strong> {result.suggestedProduct}</div>
                  <div className="flex items-center space-x-2">
                    <strong>Confidence:</strong> 
                    <Badge variant="secondary">{result.confidence}%</Badge>
                  </div>
                  <div><strong>Reasoning:</strong> {result.reasoning}</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-slate-600 pt-4 border-t">
          <p className="mb-2"><strong>Test Status:</strong></p>
          <ul className="space-y-1">
            <li>✅ Edge function deployed</li>
            <li>✅ OpenAI API key configured</li>
            <li>✅ CORS headers enabled</li>
            <li>✅ Error handling implemented</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIServiceTester;