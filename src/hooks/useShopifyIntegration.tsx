
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TokenEncryption } from '@/utils/tokenEncryption';

interface ShopifyMerchant {
  id: string;
  shop_domain: string;
  plan_type: string;
  settings: any;
  created_at: string;
  updated_at: string;
  access_token?: string;
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
        // Don't expose access_token to frontend for security
        const { access_token, ...merchantData } = data;
        setMerchant(merchantData);
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
      // Fix: Use proper string token instead of object
      const { error } = await supabase
        .from('merchants')
        .update({ 
          access_token: 'DISCONNECTED',
          token_encrypted_at: new Date().toISOString(),
          token_encryption_version: 2,
          updated_at: new Date().toISOString()
        })
        .eq('id', merchant.id);

      if (error) throw error;

      // Log disconnection event with audit trail
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: merchant.id,
          event_type: 'app_disconnected',
          event_data: {
            shop_domain: merchant.shop_domain,
            disconnected_at: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id
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
      // Call our secure backend endpoint to test connection
      const response = await fetch('/api/v1/shopify/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ merchant_id: merchant.id })
      });

      const result = await response.json();
      
      return { 
        success: result.success, 
        error: result.error || null 
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
