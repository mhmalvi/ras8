
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  merchant_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
      }

      console.log('👤 Fetching profile for user:', user.id);
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (fetchError) {
          console.error('💥 Profile fetch failed:', fetchError);
          setError(fetchError.message);
          setProfile(null);
        } else {
          console.log('✅ Profile loaded successfully:', data);
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error('💥 Profile fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setProfile(null);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('🏁 Profile fetch completed');
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

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
      }
      
      setError(null);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const refetch = async () => {
    if (user?.id) {
      setLoading(true);
      setError(null);
      // The useEffect will handle the refetch when loading state changes
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch
  };
};
