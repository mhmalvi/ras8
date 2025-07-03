
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface Customer {
  id: string;
  name: string;
  email: string;
  totalReturns: number;
  totalValue: number;
  status: 'Active' | 'Inactive';
  lastReturn: string;
}

export const useCustomersData = () => {
  const { profile } = useProfile();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.merchant_id) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    let channel: any;

    const fetchCustomersData = async () => {
      try {
        console.log('🔍 Fetching customers data for merchant:', profile.merchant_id);
        setLoading(true);

        // Fetch returns data grouped by customer email
        const { data: returnsData, error: returnsError } = await supabase
          .from('returns')
          .select('customer_email, total_amount, created_at, status')
          .eq('merchant_id', profile.merchant_id)
          .order('created_at', { ascending: false });

        if (returnsError) {
          console.error('❌ Error fetching customers data:', returnsError);
          throw returnsError;
        }

        console.log('✅ Raw returns data for customers:', returnsData?.length, 'returns');

        // Group returns by customer email and calculate stats
        const customerMap = new Map<string, {
          email: string;
          returns: typeof returnsData;
          totalReturns: number;
          totalValue: number;
          lastReturn: string;
        }>();

        returnsData?.forEach(returnItem => {
          const email = returnItem.customer_email;
          
          if (!customerMap.has(email)) {
            customerMap.set(email, {
              email,
              returns: [],
              totalReturns: 0,
              totalValue: 0,
              lastReturn: returnItem.created_at || ''
            });
          }

          const customer = customerMap.get(email)!;
          customer.returns.push(returnItem);
          customer.totalReturns += 1;
          customer.totalValue += Number(returnItem.total_amount || 0);
          
          // Update last return date if this one is more recent
          if (returnItem.created_at && returnItem.created_at > customer.lastReturn) {
            customer.lastReturn = returnItem.created_at;
          }
        });

        // Convert to Customer array
        const customersArray: Customer[] = Array.from(customerMap.values()).map((customerData, index) => {
          // Extract name from email (simple approach)
          const emailParts = customerData.email.split('@')[0];
          const name = emailParts.split('.').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join(' ');

          return {
            id: `customer-${index + 1}`,
            name: name || customerData.email,
            email: customerData.email,
            totalReturns: customerData.totalReturns,
            totalValue: customerData.totalValue,
            // Determine status based on recent activity (within last 30 days)
            status: (new Date().getTime() - new Date(customerData.lastReturn).getTime()) < (30 * 24 * 60 * 60 * 1000) 
              ? 'Active' as const 
              : 'Inactive' as const,
            lastReturn: new Date(customerData.lastReturn).toLocaleDateString()
          };
        });

        console.log('✅ Processed customers data:', customersArray.length, 'customers');
        setCustomers(customersArray);
        setError(null);

      } catch (err) {
        console.error('💥 Error processing customers data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersData();

    // Set up real-time subscription for returns changes
    channel = supabase
      .channel(`customers-realtime-${profile.merchant_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `merchant_id=eq.${profile.merchant_id}`
        },
        (payload) => {
          console.log('🔄 Returns change detected, refreshing customers data:', payload.eventType);
          fetchCustomersData();
        }
      )
      .subscribe((status) => {
        console.log('📡 Customers subscription status:', status);
      });

    // Listen for manual sync events
    const handleDataSync = () => {
      console.log('📢 Data sync event received in useCustomersData');
      fetchCustomersData();
    };

    window.addEventListener('dataSync', handleDataSync);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('dataSync', handleDataSync);
    };
  }, [profile?.merchant_id]);

  const refetch = async () => {
    if (!profile?.merchant_id) return;
    
    console.log('🔄 Manual refetch requested for customers...');
    setLoading(true);
    
    try {
      // Re-run the fetch logic
      await new Promise(resolve => {
        const event = new CustomEvent('dataSync');
        window.dispatchEvent(event);
        setTimeout(resolve, 100); // Small delay to let the event propagate
      });
    } catch (err) {
      console.error('💥 Error refetching customers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return {
    customers,
    loading,
    error,
    refetch
  };
};
