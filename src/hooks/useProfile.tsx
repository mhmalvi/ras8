
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAtomicAuth } from '@/contexts/AtomicAuthContext';

interface Profile {
  id: string;
  merchant_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'merchant_admin' | 'merchant_staff' | 'master_admin';
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAtomicAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    console.log('👤 Fetching profile for user:', userId);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('💥 Profile fetch failed:', fetchError);
        throw fetchError;
      }

      console.log('✅ Profile loaded:', data);
      setProfile(data);
      setError(null);
      return data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('💥 Profile fetch error:', err);
      setError(errorMessage);
      setProfile(null);
      throw err;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user?.id) {
        if (isMounted) {
          setProfile(null);
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await fetchProfile(user.id);
      } catch (err) {
        // Error already handled in fetchProfile
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
  }, [user?.id, fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
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
        await fetchProfile(user.id);
      } catch (err) {
        // Error already handled in fetchProfile
      } finally {
        setLoading(false);
      }
    }
  }, [user?.id, fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch
  };
};
