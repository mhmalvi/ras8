
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';

interface MerchantProfile {
  id: string;
  merchant_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'merchant_admin' | 'merchant_staff' | 'master_admin' | null;
  created_at?: string;
  updated_at?: string;
}

interface Merchant {
  id: string;
  shop_domain: string;
  plan_type: string;
  settings: any;
}

export const useMerchantProfile = () => {
  const { user, loading: authLoading } = useAtomicAuth();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      console.log('❌ No authenticated user');
      setProfile(null);
      setMerchant(null);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching user profile for:', user.id);
      setLoading(true);
      setError(null);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('💥 Error fetching profile:', profileError);
        throw profileError;
      }

      console.log('✅ Profile fetched:', profileData);
      setProfile(profileData);

      // If user has a merchant_id, fetch merchant details
      if (profileData.merchant_id) {
        console.log('🏪 Fetching merchant details for:', profileData.merchant_id);
        
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', profileData.merchant_id)
          .single();

        if (merchantError) {
          console.error('💥 Error fetching merchant:', merchantError);
          // Don't throw here, user might not have merchant assigned yet
        } else {
          console.log('✅ Merchant fetched:', merchantData);
          setMerchant(merchantData);
        }
      }

    } catch (err) {
      console.error('💥 Error in fetchProfile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    fetchProfile();
  }, [user, authLoading]);

  const updateProfile = async (updates: Partial<MerchantProfile>) => {
    if (!user || !profile) return;

    try {
      console.log('🔄 Updating profile:', updates);
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      console.log('✅ Profile updated successfully');

    } catch (err) {
      console.error('💥 Error updating profile:', err);
      throw err;
    }
  };

  const refetch = () => {
    fetchProfile();
  };

  return {
    profile,
    merchant,
    loading,
    error,
    updateProfile,
    refetch
  };
};
