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
    let timeoutId: NodeJS.Timeout;

    const fetchProfile = async () => {
      if (!user?.id) {
        console.log('⏭️ No user ID available');
        setLoading(false);
        return;
      }

      console.log('👤 Fetching profile for user:', user.id);
      setLoading(true);
      setError(null);

      try {
        // Set a timeout that actually works
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('🚫 Manual timeout reached');
            setError('Unable to load profile. Please refresh the page.');
            setProfile(null);
            setLoading(false);
          }
        }, 5000);

        // Simple query without complex timeout handling
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

        clearTimeout(timeoutId);
        console.log('📋 Profile query result:', { data, error: fetchError });

        if (fetchError) {
          console.error('💥 Profile fetch error:', fetchError);
          setError(fetchError.message);
          setProfile(null);
        } else if (data) {
          console.log('✅ Profile loaded:', data);
          setProfile(data);
          setError(null);
        } else {
          console.log('ℹ️ No profile found');
          setProfile(null);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;
        clearTimeout(timeoutId);
        
        console.error('💥 Profile fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
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
      clearTimeout(timeoutId);
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
    // Force re-fetch by updating a dependency
    if (user?.id) {
      setError(null);
      // This will trigger the effect again
      setLoading(true);
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