
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
        .eq('id', user.id);

      if (profileError) {
        console.error('💥 Error fetching profile:', profileError);
        
        // If profile doesn't exist, it might be a new user
        if (profileError.code === 'PGRST116') {
          console.log('⚠️ Profile not found, user may need profile creation');
          setError('Profile not found. Please contact support.');
          setLoading(false);
          return;
        }
        
        throw profileError;
      }

      // Handle both single object and array responses
      const profile = Array.isArray(profileData) ? profileData[0] : profileData;
      
      if (!profile) {
        console.log('⚠️ No profile data found');
        setError('Profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('✅ Profile fetched:', profile);
      setProfile(profile);

      // If user has a merchant_id, fetch merchant details
      if (profile?.merchant_id) {
        console.log('🏪 Fetching merchant details for:', profile.merchant_id);
        
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', profile.merchant_id)
          .single();

        if (merchantError) {
          console.error('💥 Error fetching merchant:', merchantError);
          if (merchantError.code === 'PGRST116') {
            console.log('⚠️ Merchant not found, may have been deleted');
            setError('Merchant not found. Please contact support.');
          }
          // Don't throw here, user profile still loaded successfully
        } else {
          console.log('✅ Merchant fetched:', merchantData);
          setMerchant(merchantData);
        }
      } else {
        console.log('ℹ️ User has no merchant assigned');
        setMerchant(null);
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
