
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayCircle, PauseCircle, RotateCcw, Download, Zap, Brain, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useRealReturnsData } from '@/hooks/useRealReturnsData';

interface BulkProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  action: 'generate_recommendations' | 'risk_analysis' | 'auto_approve' | 'generate_messages';
  total: number;
  processed: number;
  successful: number;
  failed: number;
  startedAt?: string;
  completedAt?: string;
}

const BulkAIProcessor = () => {
  const { returns, loading, refetch } = useRealReturnsData();
  const { toast } = useToast();
  const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<'generate_recommendations' | 'risk_analysis' | 'auto_approve' | 'generate_messages'>('generate_recommendations');
  const [processingJob, setProcessingJob] = useState<BulkProcessingJob | null>(null);
  const [processingResults, setProcessingResults] = useState<any[]>([]);

  const pendingReturns = returns.filter(r => r.status === 'requested');
  const allSelected = selectedReturns.length === pendingReturns.length;
  const someSelected = selectedReturns.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedReturns([]);
    } else {
      setSelectedReturns(pendingReturns.map(r => r.id));
    }
  };

  const toggleSelectReturn = (returnId: string) => {
    setSelectedReturns(prev => 
      prev.includes(returnId) 
        ? prev.filter(id => id !== returnId)
        : [...prev, returnId]
    );
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
      startedAt: new Date().toISOString()
    };

    setProcessingJob(job);
    setProcessingResults([]);

    toast({
      title: "Bulk Processing Started",
      description: `Processing ${selectedReturns.length} returns with ${selectedAction.replace('_', ' ')}`,
    });

    // Process returns in batches to avoid overwhelming the API
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < selectedReturns.length; i += batchSize) {
      batches.push(selectedReturns.slice(i, i + batchSize));
    }

    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    const results: any[] = [];

    for (const batch of batches) {
      const batchPromises = batch.map(async (returnId) => {
        const returnData = returns.find(r => r.id === returnId);
        if (!returnData) return { returnId, success: false, error: 'Return not found' };

        try {
          let result;
          
          switch (selectedAction) {
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
                  suggested_product_name: result.data.data.suggestedProduct,
                  suggestion_type: 'exchange',
                  confidence_score: result.data.data.confidence / 100,
                  reasoning: result.data.data.reasoning
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
              // Auto-approve returns with high AI confidence and low risk
              const riskResult = await supabase.functions.invoke('analyze-return-risk', {
                body: {
                  returnId,
                  returnReason: returnData.reason,
                  customerEmail: returnData.customer_email,
                  orderValue: returnData.total_amount
                }
              });

              if (riskResult.data?.riskLevel === 'low') {
                await supabase.from('returns').update({ 
                  status: 'approved',
                  updated_at: new Date().toISOString()
                }).eq('id', returnId);
                
                result = { data: { success: true, action: 'approved' } };
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
            success: true, 
            result: result?.data,
            customerEmail: returnData.customer_email,
            reason: returnData.reason
          };
        } catch (error: any) {
          return { 
            returnId, 
            success: false, 
            error: error.message,
            customerEmail: returnData.customer_email,
            reason: returnData.reason
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        totalProcessed++;
        if (result.success) {
          totalSuccessful++;
        } else {
          totalFailed++;
        }
        results.push(result);
      });

      // Update job progress
      setProcessingJob(prev => prev ? {
        ...prev,
        processed: totalProcessed,
        successful: totalSuccessful,
        failed: totalFailed
      } : null);

      setProcessingResults([...results]);

      // Small delay between batches to prevent rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Complete the job
    setProcessingJob(prev => prev ? {
      ...prev,
      status: 'completed',
      completedAt: new Date().toISOString()
    } : null);

    toast({
      title: "Bulk Processing Complete",
      description: `Processed ${totalProcessed} returns. ${totalSuccessful} successful, ${totalFailed} failed.`,
    });

    // Refresh returns data
    await refetch();
  };

  const exportResults = () => {
    if (processingResults.length === 0) return;

    const csvContent = [
      ['Return ID', 'Customer Email', 'Reason', 'Status', 'Result'],
      ...processingResults.map(result => [
        result.returnId,
        result.customerEmail,
        result.reason,
        result.success ? 'Success' : 'Failed',
        result.success ? JSON.stringify(result.result) : result.error
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-processing-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetJob = () => {
    setProcessingJob(null);
    setProcessingResults([]);
    setSelectedReturns([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Bulk AI Processing
          </CardTitle>
          <CardDescription>
            Process multiple returns with AI-powered automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!processingJob && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Action</label>
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

                <div className="border rounded-lg">
                  <div className="p-4 border-b bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                          className="mr-2"
                        />
                        <span className="font-medium">
                          Pending Returns ({pendingReturns.length})
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
                        {pendingReturns.map((returnItem) => (
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

          {processingJob && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Processing Progress</h3>
                      <Badge variant={processingJob.status === 'completed' ? 'default' : 'secondary'}>
                        {processingJob.status}
                      </Badge>
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
                  </div>
                </CardContent>
              </Card>

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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

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
  );
};

export default BulkAIProcessor;
