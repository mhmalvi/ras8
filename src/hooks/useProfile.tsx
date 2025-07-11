
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
    let mounted = true;
    let controller: AbortController;

    const fetchProfile = async () => {
      if (!user?.id) {
        console.log('⏭️ No user ID available');
        if (mounted) {
          setLoading(false);
          setProfile(null);
          setError(null);
        }
        return;
      }

      console.log('👤 Fetching profile for user:', user.id);
      
      if (mounted) {
        setLoading(true);
        setError(null);
      }

      try {
        controller = new AbortController();
        
        // Create a simple timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
        });

        // Create the query promise
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .abortSignal(controller.signal)
          .maybeSingle();

        console.log('🔍 Executing query with 5s timeout...');
        
        // Race between query and timeout
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        if (!mounted) return;

        const { data, error: fetchError } = result as any;

        if (fetchError) {
          console.error('💥 Profile fetch error:', fetchError);
          setError(fetchError.message);
          setProfile(null);
        } else {
          console.log('✅ Profile loaded successfully:', data);
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;
        
        console.error('💥 Profile fetch failed:', err);
        
        // If it's a timeout or abort, set a specific error
        if (err instanceof Error && (err.message.includes('timeout') || err.message.includes('aborted'))) {
          setError('Unable to load profile. Please refresh the page.');
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('🏁 Profile fetch completed');
        }
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
      if (controller) {
        controller.abort();
      }
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
      
      setProfile(data);
      setError(null);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const refetch = () => {
    if (user?.id) {
      setError(null);
      setLoading(true);
      // Force re-run of effect by updating dependency
      setTimeout(() => {
        window.location.reload();
      }, 100);
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
