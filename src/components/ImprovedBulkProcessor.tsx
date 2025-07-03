import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlayCircle, PauseCircle, RotateCcw, Download, Zap, Brain, CheckCircle, XCircle, Clock, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useRealReturnsData } from '@/hooks/useRealReturnsData';
import GlobalErrorBoundary from './GlobalErrorBoundary';
import { LoadingSpinner, BulkProcessingLoadingState } from './LoadingStates';

interface BulkProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed';
  action: 'generate_recommendations' | 'risk_analysis' | 'auto_approve' | 'generate_messages';
  total: number;
  processed: number;
  successful: number;
  failed: number;
  paused: boolean;
  startedAt?: string;
  completedAt?: string;
  errors: string[];
}

interface ProcessingResult {
  returnId: string;
  success: boolean;
  result?: any;
  error?: string;
  customerEmail?: string;
  reason?: string;
  timestamp: string;
}

const BATCH_SIZE = 2; // Reduced for better reliability
const BATCH_DELAY = 3000; // Increased delay between batches
const MAX_RETRIES = 2;

const ImprovedBulkProcessor = () => {
  const { returns, loading, refetch } = useRealReturnsData();
  const { toast } = useToast();
  const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<BulkProcessingJob['action']>('generate_recommendations');
  const [processingJob, setProcessingJob] = useState<BulkProcessingJob | null>(null);
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Filter returns that can be processed
  const processableReturns = returns.filter(r => r.status === 'requested');
  const allSelected = selectedReturns.length === processableReturns.length && processableReturns.length > 0;

  useEffect(() => {
    console.log('📊 BulkProcessor - Data status:', {
      totalReturns: returns.length,
      processableReturns: processableReturns.length,
      selectedReturns: selectedReturns.length,
      loading
    });
  }, [returns, processableReturns.length, selectedReturns.length, loading]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedReturns([]);
    } else {
      setSelectedReturns(processableReturns.map(r => r.id));
    }
  };

  const toggleSelectReturn = (returnId: string) => {
    setSelectedReturns(prev => 
      prev.includes(returnId) 
        ? prev.filter(id => id !== returnId)
        : [...prev, returnId]
    );
  };

  const processWithRetry = async (returnId: string, returnData: any, action: string, retryCount = 0): Promise<ProcessingResult> => {
    try {
      let result;
      
      switch (action) {
        case 'generate_recommendations':
          result = await supabase.functions.invoke('generate-exchange-recommendation', {
            body: {
              returnReason: returnData.reason,
              productName: returnData.return_items?.[0]?.product_name || 'Product',
              customerEmail: returnData.customer_email,
              orderValue: returnData.total_amount
            }
          });
          
          if (result.data?.success) {
            await supabase.from('ai_suggestions').insert({
              return_id: returnId,
              suggested_product_name: result.data.data?.suggestedProduct || 'AI Recommendation',
              suggestion_type: 'exchange',
              confidence_score: (result.data.data?.confidence || 75) / 100,
              reasoning: result.data.data?.reasoning || 'AI-generated exchange recommendation'
            });
          }
          break;

        case 'risk_analysis':
          result = await supabase.functions.invoke('analyze-return-risk', {
            body: {
              returnId,
              productName: returnData.return_items?.[0]?.product_name || 'Product',
              returnReason: returnData.reason,
              customerEmail: returnData.customer_email,
              orderValue: returnData.total_amount
            }
          });
          break;

        case 'auto_approve':
          const riskResult = await supabase.functions.invoke('analyze-return-risk', {
            body: {
              returnId,
              returnReason: returnData.reason,
              customerEmail: returnData.customer_email,
              orderValue: returnData.total_amount
            }
          });

          if (riskResult.data?.riskLevel === 'low' || riskResult.data?.risk === 'low') {
            const { error: updateError } = await supabase
              .from('returns')
              .update({ 
                status: 'approved',
                updated_at: new Date().toISOString()
              })
              .eq('id', returnId);

            if (!updateError) {
              result = { data: { success: true, action: 'approved' } };
            } else {
              throw new Error('Database update failed');
            }
          } else {
            result = { data: { success: false, reason: 'High risk - manual review required' } };
          }
          break;

        case 'generate_messages':
          result = await supabase.functions.invoke('generate-customer-message', {
            body: {
              returnId,
              customerEmail: returnData.customer_email,
              returnReason: returnData.reason,
              returnStatus: returnData.status,
              messageType: 'update'
            }
          });
          break;

        default:
          throw new Error('Unknown action');
      }

      return {
        returnId,
        success: result?.data?.success || false,
        result: result?.data,
        customerEmail: returnData.customer_email,
        reason: returnData.reason,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`❌ Error processing return ${returnId} (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Retrying return ${returnId}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return processWithRetry(returnId, returnData, action, retryCount + 1);
      }
      
      return {
        returnId,
        success: false,
        error: error.message || 'Unknown error',
        customerEmail: returnData.customer_email,
        reason: returnData.reason,
        timestamp: new Date().toISOString()
      };
    }
  };

  const startBulkProcessing = async () => {
    if (selectedReturns.length === 0) {
      toast({
        title: "No Returns Selected",
        description: "Please select returns to process.",
        variant: "destructive"
      });
      return;
    }

    const job: BulkProcessingJob = {
      id: `job-${Date.now()}`,
      status: 'processing',
      action: selectedAction,
      total: selectedReturns.length,
      processed: 0,
      successful: 0,
      failed: 0,
      paused: false,
      startedAt: new Date().toISOString(),
      errors: []
    };

    setProcessingJob(job);
    setProcessingResults([]);
    setIsPaused(false);

    toast({
      title: "Bulk Processing Started",
      description: `Processing ${selectedReturns.length} returns with ${selectedAction.replace('_', ' ')}`,
    });

    console.log('⚡ Starting bulk processing:', {
      action: selectedAction,
      returnCount: selectedReturns.length,
      batchSize: BATCH_SIZE
    });

    try {
      const batches = [];
      for (let i = 0; i < selectedReturns.length; i += BATCH_SIZE) {
        batches.push(selectedReturns.slice(i, i + BATCH_SIZE));
      }

      let totalProcessed = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;
      const results: ProcessingResult[] = [];
      const jobErrors: string[] = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        // Check if paused
        if (isPaused) {
          setProcessingJob(prev => prev ? { ...prev, status: 'paused' } : null);
          break;
        }

        const batch = batches[batchIndex];
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} returns`);
        
        const batchPromises = batch.map(async (returnId) => {
          const returnData = returns.find(r => r.id === returnId);
          if (!returnData) {
            console.error('❌ Return not found:', returnId);
            return {
              returnId,
              success: false,
              error: 'Return not found',
              timestamp: new Date().toISOString()
            };
          }

          return processWithRetry(returnId, returnData, selectedAction);
        });

        try {
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((settledResult, index) => {
            totalProcessed++;
            
            if (settledResult.status === 'fulfilled') {
              const result = settledResult.value;
              if (result.success) {
                totalSuccessful++;
              } else {
                totalFailed++;
                if (result.error) {
                  jobErrors.push(`${result.returnId}: ${result.error}`);
                }
              }
              results.push(result);
            } else {
              totalFailed++;
              const returnId = batch[index];
              jobErrors.push(`${returnId}: ${settledResult.reason}`);
              results.push({
                returnId,
                success: false,
                error: settledResult.reason?.toString() || 'Promise rejected',
                timestamp: new Date().toISOString()
              });
            }
          });

          // Update job progress
          setProcessingJob(prev => prev ? {
            ...prev,
            processed: totalProcessed,
            successful: totalSuccessful,
            failed: totalFailed,
            errors: jobErrors
          } : null);

          setProcessingResults([...results]);

          // Delay between batches (except for last batch)
          if (batchIndex < batches.length - 1 && !isPaused) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          }

        } catch (batchError) {
          console.error('❌ Batch processing error:', batchError);
          jobErrors.push(`Batch ${batchIndex + 1}: ${batchError}`);
        }
      }

      // Complete the job
      if (!isPaused) {
        setProcessingJob(prev => prev ? {
          ...prev,
          status: 'completed',
          completedAt: new Date().toISOString()
        } : null);

        console.log('🏁 Bulk processing completed:', {
          total: totalProcessed,
          successful: totalSuccessful,
          failed: totalFailed,
          errors: jobErrors.length
        });

        toast({
          title: "Bulk Processing Complete",
          description: `Processed ${totalProcessed} returns. ${totalSuccessful} successful, ${totalFailed} failed.`,
        });

        // Refresh returns data
        await refetch();
      }

    } catch (error) {
      console.error('💥 Fatal bulk processing error:', error);
      setProcessingJob(prev => prev ? {
        ...prev,
        status: 'failed',
        errors: [...(prev.errors || []), error instanceof Error ? error.message : 'Unknown error']
      } : null);
      
      toast({
        title: "Processing Failed",
        description: "Bulk processing encountered a fatal error.",
        variant: "destructive"
      });
    }
  };

  const pauseProcessing = () => {
    setIsPaused(true);
    toast({
      title: "Processing Paused",
      description: "Bulk processing has been paused.",
    });
  };

  const resumeProcessing = () => {
    setIsPaused(false);
    toast({
      title: "Processing Resumed",
      description: "Bulk processing has been resumed.",
    });
  };

  const exportResults = () => {
    if (processingResults.length === 0) {
      toast({
        title: "No Results to Export",
        description: "Complete a bulk processing job first.",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      ['Return ID', 'Customer Email', 'Reason', 'Status', 'Result', 'Timestamp'],
      ...processingResults.map(result => [
        result.returnId,
        result.customerEmail || 'N/A',
        result.reason || 'N/A',
        result.success ? 'Success' : 'Failed',
        result.success ? 'Processed successfully' : (result.error || 'Unknown error'),
        result.timestamp
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-processing-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Results Exported",
      description: "Processing results have been downloaded as CSV.",
    });
  };

  const resetJob = () => {
    setProcessingJob(null);
    setProcessingResults([]);
    setSelectedReturns([]);
    setIsPaused(false);
  };

  if (loading) {
    return <BulkProcessingLoadingState />;
  }

  return (
    <GlobalErrorBoundary level="component">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Improved Bulk AI Processing
            </CardTitle>
            <CardDescription>
              Process multiple returns with AI-powered automation and enhanced error handling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Information */}
            {returns.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No returns data available. Make sure you're connected to a merchant account with returns.
                </AlertDescription>
              </Alert>
            ) : processableReturns.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No processable returns found. Only returns with "requested" status can be processed.
                  <br />
                  <strong>Current returns:</strong> {returns.length} total, {returns.filter(r => r.status !== 'requested').length} already processed
                </AlertDescription>
              </Alert>
            ) : null}

            {!processingJob && processableReturns.length > 0 && (
              <>
                {/* Action Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Processing Action</label>
                    <Select value={selectedAction} onValueChange={(value: any) => setSelectedAction(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose processing action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generate_recommendations">Generate AI Recommendations</SelectItem>
                        <SelectItem value="risk_analysis">Perform Risk Analysis</SelectItem>
                        <SelectItem value="auto_approve">Auto-Approve Low Risk Returns</SelectItem>
                        <SelectItem value="generate_messages">Generate Customer Messages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Returns Selection */}
                  <div className="border rounded-lg">
                    <div className="p-4 border-b bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={toggleSelectAll}
                            disabled={processableReturns.length === 0}
                          />
                          <span className="font-medium">
                            Select All ({processableReturns.length} processable returns)
                          </span>
                        </div>
                        <Badge variant="outline">
                          {selectedReturns.length} selected
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processableReturns.map((returnItem) => (
                            <TableRow key={returnItem.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedReturns.includes(returnItem.id)}
                                  onCheckedChange={() => toggleSelectReturn(returnItem.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {returnItem.customer_email}
                              </TableCell>
                              <TableCell>{returnItem.reason}</TableCell>
                              <TableCell>${returnItem.total_amount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Button 
                    onClick={startBulkProcessing}
                    disabled={selectedReturns.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Start Bulk Processing ({selectedReturns.length} returns)
                  </Button>
                </div>
              </>
            )}

            {/* Processing Status */}
            {processingJob && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Processing Progress</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            processingJob.status === 'completed' ? 'default' : 
                            processingJob.status === 'failed' ? 'destructive' :
                            processingJob.status === 'paused' ? 'secondary' : 'secondary'
                          }>
                            {processingJob.status}
                          </Badge>
                          {processingJob.status === 'processing' && (
                            <Button size="sm" variant="outline" onClick={pauseProcessing}>
                              <PauseCircle className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          {processingJob.status === 'paused' && (
                            <Button size="sm" variant="outline" onClick={resumeProcessing}>
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <Progress 
                        value={(processingJob.processed / processingJob.total) * 100} 
                        className="w-full"
                      />
                      
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{processingJob.total}</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{processingJob.processed}</div>
                          <div className="text-sm text-muted-foreground">Processed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{processingJob.successful}</div>
                          <div className="text-sm text-muted-foreground">Successful</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{processingJob.failed}</div>
                          <div className="text-sm text-muted-foreground">Failed</div>
                        </div>
                      </div>

                      {processingJob.status === 'processing' && (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner text="Processing returns..." />
                        </div>
                      )}

                      {processingJob.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Errors encountered:</strong>
                            <div className="mt-2 max-h-20 overflow-y-auto">
                              {processingJob.errors.slice(0, 3).map((error, index) => (
                                <div key={index} className="text-xs">{error}</div>
                              ))}
                              {processingJob.errors.length > 3 && (
                                <div className="text-xs">... and {processingJob.errors.length - 3} more errors</div>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Results Table */}
                {processingResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Processing Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Result</TableHead>
                              <TableHead>Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {processingResults.map((result, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {result.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {result.customerEmail}
                                </TableCell>
                                <TableCell>{result.reason}</TableCell>
                                <TableCell className="text-sm">
                                  {result.success ? 'Processed successfully' : result.error}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(result.timestamp).toLocaleTimeString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={exportResults} variant="outline" disabled={processingResults.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                  <Button onClick={resetJob} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Start New Job
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GlobalErrorBoundary>
  );
};

export default ImprovedBulkProcessor;
