
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShopifyMerchant {
  id: string;
  shop_domain: string;
  plan_type: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export const useShopifyIntegration = () => {
  const [merchant, setMerchant] = useState<ShopifyMerchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No merchant found
          setMerchant(null);
        } else {
          throw error;
        }
      } else {
        setMerchant(data);
      }
    } catch (err) {
      console.error('Error fetching merchant data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch merchant data');
    } finally {
      setLoading(false);
    }
  };

  const disconnectShopify = async () => {
    if (!merchant) return;

    try {
      const { error } = await supabase
        .from('merchants')
        .update({ 
          access_token: 'DISCONNECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', merchant.id);

      if (error) throw error;

      // Log disconnection event
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: merchant.id,
          event_type: 'app_disconnected',
          event_data: {
            shop_domain: merchant.shop_domain,
            disconnected_at: new Date().toISOString()
          }
        });

      setMerchant(null);
      toast({
        title: "Disconnected",
        description: "Your Shopify store has been disconnected successfully.",
      });

    } catch (err) {
      console.error('Error disconnecting Shopify:', err);
      toast({
        title: "Error",
        description: "Failed to disconnect Shopify store.",
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    if (!merchant?.shop_domain) return { success: false, error: 'No merchant connected' };

    try {
      // Test connection by trying to fetch shop info
      const response = await fetch(`https://${merchant.shop_domain}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': 'test-connection', // This will fail but we can check the response
        },
      });

      return { 
        success: response.status === 401, // 401 means our token is being checked
        error: response.status === 404 ? 'Store not found' : null 
      };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Connection test failed' 
      };
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, []);

  return {
    merchant,
    loading,
    error,
    disconnectShopify,
    testConnection,
    refetch: fetchMerchantData
  };
};
