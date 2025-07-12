
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';

interface MerchantProfile {
  id: string;
  merchant_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface MerchantData {
  id: string;
  shop_domain: string;
  plan_type: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export const useMerchantProfile = () => {
  const { user, initialized } = useAtomicAuth();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchantProfile = useCallback(async (userId: string) => {
    console.log('👤 Fetching merchant-isolated profile for user:', userId);
    
    try {
      // Fetch user profile with merchant context
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        console.log('📝 No profile found, user needs to complete setup');
        setProfile(null);
        setMerchant(null);
        return;
      }

      setProfile(profileData);

      // If user has merchant_id, fetch merchant data
      if (profileData.merchant_id) {
        console.log('🏢 Fetching merchant data for:', profileData.merchant_id);
        
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .select('id, shop_domain, plan_type, settings, created_at, updated_at')
          .eq('id', profileData.merchant_id)
          .maybeSingle();

        if (merchantError) {
          console.error('❌ Merchant fetch failed:', merchantError);
          throw merchantError;
        }

        setMerchant(merchantData);
        console.log('✅ Merchant-isolated profile loaded:', {
          profile: profileData.id,
          merchant: merchantData?.id
        });
      } else {
        console.log('⚠️ User has no merchant assignment');
        setMerchant(null);
      }

      setError(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('💥 Merchant profile fetch error:', err);
      setError(errorMessage);
      setProfile(null);
      setMerchant(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!initialized) {
        console.log('⏳ Auth not initialized yet, waiting...');
        return;
      }

      if (!user?.id) {
        if (isMounted) {
          setProfile(null);
          setMerchant(null);
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await fetchMerchantProfile(user.id);
      } catch (err) {
        // Error already handled in fetchMerchantProfile
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id, initialized, fetchMerchantProfile]);

  const updateProfile = async (updates: Partial<MerchantProfile>) => {
    if (!user?.id) {
      return { error: 'No user logged in' };
    }

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return { error: updateError.message };
      }
      
      if (data) {
        setProfile(data);
        console.log('✅ Profile updated:', data);
      }
      
      setError(null);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const refetch = useCallback(async () => {
    if (user?.id) {
      setLoading(true);
      setError(null);
      try {
        await fetchMerchantProfile(user.id);
      } catch (err) {
        // Error already handled in fetchMerchantProfile
      } finally {
        setLoading(false);
      }
    }
  }, [user?.id, fetchMerchantProfile]);

  return {
    profile,
    merchant,
    loading,
    error,
    updateProfile,
    refetch,
    // Helper flags
    hasProfile: !!profile,
    hasMerchant: !!merchant,
    needsSetup: initialized && !loading && user && (!profile || !profile.merchant_id)
  };
};
