
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

// Simple cache to prevent multiple fetches
const profileCache = new Map<string, Profile>();
const activeRequests = new Map<string, Promise<Profile | null>>();

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cachedProfile = profileCache.get(user.id);
    if (cachedProfile) {
      console.log('✨ Using cached profile for user:', user.id);
      setProfile(cachedProfile);
      setLoading(false);
      setError(null);
      return;
    }

    // Check if request is already in progress
    const existingRequest = activeRequests.get(user.id);
    if (existingRequest) {
      console.log('⏳ Profile request already in progress');
      existingRequest.then(result => {
        setProfile(result);
        setLoading(false);
        setError(null);
      }).catch(err => {
        setError(err.message);
        setLoading(false);
      });
      return;
    }

    console.log('👤 Fetching profile for user:', user.id);
    setLoading(true);
    setError(null);

    // Create new request
    const fetchRequest = async (): Promise<Profile | null> => {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data) {
          profileCache.set(user.id, data);
          console.log('✅ Profile loaded successfully:', data);
        }

        return data;
      } catch (err) {
        console.error('💥 Profile fetch failed:', err);
        throw err;
      } finally {
        activeRequests.delete(user.id);
      }
    };

    // Store and execute request
    const request = fetchRequest();
    activeRequests.set(user.id, request);

    request
      .then(result => {
        setProfile(result);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
        console.log('🏁 Profile fetch completed');
      });

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
        profileCache.set(user.id, data);
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
      profileCache.delete(user.id);
      activeRequests.delete(user.id);
      setLoading(true);
      setError(null);
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
