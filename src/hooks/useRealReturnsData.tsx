import { useState, useEffect } from 'react';
import { MerchantReturnsService, ReturnData } from '@/services/merchantReturnsService';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from './useProfile';

export const useRealReturnsData = () => {
  const { profile, loading: profileLoading } = useProfile();
  const [returns, setReturns] = useState<ReturnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReturns = async () => {
    // Don't proceed if profile is still loading
    if (profileLoading) {
      console.log('⏳ Profile still loading, waiting...');
      return;
    }

    // Don't proceed if no merchant_id
    if (!profile?.merchant_id) {
      console.log('❌ No merchant_id in profile');
      setReturns([]);
      setLoading(false);
      setError('No merchant profile found');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching returns for merchant:', profile.merchant_id);
      const data = await MerchantReturnsService.fetchReturns(profile.merchant_id);
      console.log('✅ Fetched returns data:', data.length, 'records');
      setReturns(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch returns';
      setError(errorMessage);
      console.error('💥 Error fetching returns:', err);
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
    // Only fetch when we have a valid merchant_id and profile is not loading
    if (!profileLoading && profile?.merchant_id) {
      fetchReturns();
    }
  }, [profile?.merchant_id, profileLoading]);

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
