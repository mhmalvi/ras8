
import { useState, useEffect } from 'react';
import { MerchantReturnsService, ReturnData } from '@/services/merchantReturnsService';
import { useToast } from '@/hooks/use-toast';

export const useRealReturnsData = () => {
  const [returns, setReturns] = useState<ReturnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MerchantReturnsService.fetchReturns();
      setReturns(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch returns';
      setError(errorMessage);
      console.error('Error fetching returns:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateReturnStatus = async (returnId: string, status: string, reason?: string) => {
    try {
      await MerchantReturnsService.updateReturnStatus(returnId, status, reason);
      await fetchReturns(); // Refresh the data
      
      toast({
        title: "Return Updated",
        description: `Return status changed to ${status}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update return';
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const bulkUpdateReturns = async (returnIds: string[], status: string) => {
    try {
      await MerchantReturnsService.bulkUpdateReturns(returnIds, status);
      await fetchReturns(); // Refresh the data
      
      toast({
        title: "Bulk Update Complete",
        description: `${returnIds.length} returns updated to ${status}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update returns';
      toast({
        title: "Bulk Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  return {
    returns,
    loading,
    error,
    fetchReturns,
    refetch: fetchReturns, // Add refetch as alias for fetchReturns
    updateReturnStatus,
    bulkUpdateReturns
  };
};
