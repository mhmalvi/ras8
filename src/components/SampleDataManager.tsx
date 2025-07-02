
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DatabaseIcon, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createComprehensiveSampleData, clearAllSampleData } from '@/utils/createComprehensiveSampleData';

const SampleDataManager = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { toast } = useToast();

  const handleCreateData = async () => {
    setLoading(true);
    setResult(null);
    setDebugInfo([]);
    
    // Capture console logs for debugging
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];
    
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    
    console.error = (...args) => {
      logs.push(`ERROR: ${args.join(' ')}`);
      originalError(...args);
    };
    
    try {
      const result = await createComprehensiveSampleData();
      setResult(result);
      setDebugInfo(logs);
      
      if (result.success) {
        // Dispatch custom event to notify other components that sample data was created
        window.dispatchEvent(new CustomEvent('sampleDataCreated'));
        
        toast({
          title: "Sample data created successfully!",
          description: `Created ${result.summary.returns} returns across ${result.summary.merchants} merchants with AI suggestions and analytics.`,
        });
      } else {
        toast({
          title: "Error creating sample data",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(logs);
      toast({
        title: "Error creating sample data",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      // Restore original console functions
      console.log = originalLog;
      console.error = originalError;
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    
    try {
      const result = await clearAllSampleData();
      
      if (result.success) {
        setResult(null);
        setDebugInfo([]);
        toast({
          title: "Sample data cleared successfully!",
          description: "All test data has been removed from the database.",
        });
      } else {
        toast({
          title: "Error clearing sample data",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error clearing sample data",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="h-5 w-5" />
          Sample Data Manager
        </CardTitle>
        <CardDescription>
          Create realistic test data to populate your returns automation dashboard with merchants, returns, AI suggestions, and analytics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {result && result.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sample data created successfully!</strong>
              <div className="mt-2 text-sm space-y-1">
                <div>• {result.summary.merchants} merchants across different plan types</div>
                <div>• {result.summary.returns} returns with various statuses</div>
                <div>• {result.summary.returnItems} return items with refund/exchange actions</div>
                <div>• {result.summary.aiSuggestions} AI suggestions with confidence scores</div>
                <div>• {result.summary.analyticsEvents} analytics events for reporting</div>
                <div>• {result.summary.billingRecords} billing records for subscription tracking</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {result && !result.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {result.error}
            </AlertDescription>
          </Alert>
        )}

        {debugInfo.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Debug Information:</strong>
              <div className="mt-2 text-xs max-h-40 overflow-y-auto bg-slate-50 p-2 rounded">
                {debugInfo.map((log, index) => (
                  <div key={index} className="font-mono text-xs">
                    {log}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Sample Data Includes:</h4>
            <ul className="text-sm text-slate-600 space-y-1 ml-4">
              <li>• 3 sample merchants with different plan types (Starter, Growth, Pro)</li>
              <li>• 45+ realistic return requests with various statuses</li>
              <li>• Return items with product names and exchange/refund actions</li>
              <li>• AI suggestions with confidence scores and reasoning</li>
              <li>• Historical analytics events for dashboard metrics</li>
              <li>• Billing records for subscription management</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleCreateData} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Data...
                </>
              ) : (
                <>
                  <DatabaseIcon className="mr-2 h-4 w-4" />
                  Create Sample Data
                </>
              )}
            </Button>

            <Button 
              onClick={handleClearData} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </>
              )}
            </Button>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This will create test data in your Supabase database. Use "Clear All Data" to remove test data when done testing.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SampleDataManager;
