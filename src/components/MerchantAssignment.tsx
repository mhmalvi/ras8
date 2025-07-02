
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface Merchant {
  id: string;
  shop_domain: string;
  plan_type: string;
}

const MerchantAssignment = () => {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingMerchants, setFetchingMerchants] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMerchants();
  }, []);

  // Refresh merchants list when component becomes visible or when sample data might have changed
  useEffect(() => {
    const refreshMerchants = () => {
      console.log('🔄 Refreshing merchants list...');
      fetchMerchants();
    };
    
    // Listen for sample data creation events
    const handleSampleDataCreated = () => {
      console.log('📢 Sample data created event received, refreshing merchants...');
      refreshMerchants();
    };
    
    // Listen for focus events to refresh when user comes back to the tab
    window.addEventListener('focus', refreshMerchants);
    window.addEventListener('sampleDataCreated', handleSampleDataCreated);
    
    return () => {
      window.removeEventListener('focus', refreshMerchants);
      window.removeEventListener('sampleDataCreated', handleSampleDataCreated);
    };
  }, []);

  const fetchMerchants = async () => {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('id, shop_domain, plan_type')
        .order('shop_domain');

      if (error) throw error;
      setMerchants(data || []);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      toast({
        title: "Error fetching merchants",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setFetchingMerchants(false);
    }
  };

  const handleAssignMerchant = async () => {
    if (!selectedMerchant || !user) return;

    console.log('🔧 Starting merchant assignment...', { selectedMerchant, userId: user.id });
    setLoading(true);
    try {
      console.log('📝 Updating profile with merchant_id:', selectedMerchant);
      const { error } = await supabase
        .from('profiles')
        .update({ merchant_id: selectedMerchant })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Profile update error:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully, refetching...');
      await refetchProfile();
      
      console.log('🔄 Profile refetch complete');
      
      toast({
        title: "Merchant assigned successfully!",
        description: "You can now access the merchant's returns data.",
      });
    } catch (error) {
      console.error('💥 Error assigning merchant:', error);
      toast({
        title: "Error assigning merchant",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.merchant_id) {
    const assignedMerchant = merchants.find(m => m.id === profile.merchant_id);
    return (
      <Alert>
        <UserCheck className="h-4 w-4" />
        <AlertDescription>
          You are currently assigned to merchant: <strong>{assignedMerchant?.shop_domain || 'Loading...'}</strong>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Merchant Assignment
        </CardTitle>
        <CardDescription>
          Select a merchant to access their returns data and dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {fetchingMerchants ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading merchants...</span>
          </div>
        ) : merchants.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No merchants found. Create sample data first to get test merchants.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Select Merchant</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFetchingMerchants(true);
                    fetchMerchants();
                  }}
                  disabled={fetchingMerchants}
                >
                  <RefreshCw className={`h-3 w-3 ${fetchingMerchants ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a merchant..." />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((merchant) => (
                    <SelectItem key={merchant.id} value={merchant.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{merchant.shop_domain}</span>
                        <span className="text-xs text-slate-500 ml-2 capitalize">
                          {merchant.plan_type}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAssignMerchant}
              disabled={!selectedMerchant || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Merchant'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MerchantAssignment;
