
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

// Create a simple cache to prevent multiple fetches
let profileCache: { [key: string]: Profile } = {};
let profilePromises: { [key: string]: Promise<Profile | null> } = {};

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
        if (mounted) {
          setLoading(false);
          setProfile(null);
          setError(null);
        }
        return;
      }

      // Check cache first
      if (profileCache[user.id]) {
        console.log('✨ Using cached profile for user:', user.id, Object.keys(profileCache).length);
        if (mounted) {
          setProfile(profileCache[user.id]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      // Check if there's already a pending request
      if (profilePromises[user.id]) {
        console.log('⏳ Profile still loading, waiting...');
        try {
          const cachedProfile = await profilePromises[user.id];
          if (mounted) {
            setProfile(cachedProfile);
            setLoading(false);
            setError(null);
          }
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setProfile(null);
            setLoading(false);
          }
        }
        return;
      }

      console.log('👤 Fetching profile for user:', user.id);
      
      if (mounted) {
        setLoading(true);
        setError(null);
      }

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('⚠️ Profile fetch timeout, forcing completion');
          setLoading(false);
          setError('Profile fetch timed out');
          delete profilePromises[user.id];
        }
      }, 10000); // 10 second timeout

      // Create a promise for this fetch to prevent duplicates
      profilePromises[user.id] = (async () => {
        try {
          const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (fetchError) {
            console.error('💥 Profile fetch error:', fetchError);
            throw new Error(fetchError.message);
          }

          console.log('✅ Profile loaded successfully:', data);
          
          // Cache the result
          if (data) {
            profileCache[user.id] = data;
          }
          
          return data;
        } catch (err) {
          console.error('💥 Profile fetch failed:', err);
          throw err;
        } finally {
          // Clean up the promise
          delete profilePromises[user.id];
        }
      })();

      try {
        const fetchedProfile = await profilePromises[user.id];
        if (mounted) {
          clearTimeout(timeoutId);
          setProfile(fetchedProfile);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          clearTimeout(timeoutId);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setProfile(null);
        }
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
      if (timeoutId) {
        clearTimeout(timeoutId);
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
      
      // Update cache
      if (data) {
        profileCache[user.id] = data;
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

  const refetch = async () => {
    if (user?.id) {
      // Clear cache for this user
      delete profileCache[user.id];
      delete profilePromises[user.id];
      
      setError(null);
      setLoading(true);
      
      // Trigger re-fetch by clearing cache and re-running effect
      const event = new CustomEvent('refetchProfile');
      window.dispatchEvent(event);
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
