
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
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const fetchProfile = async () => {
    if (!user?.id || fetchAttempted) {
      console.log('⏭️ Skipping profile fetch - no user or already attempted');
      setLoading(false);
      return;
    }

    console.log('👤 Fetching profile for user:', user.id);
    setFetchAttempted(true);
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('📋 Profile query result:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No profile found - user needs to create one');
          setProfile(null);
          setError(null);
        } else {
          throw error;
        }
      } else {
        console.log('✅ Profile loaded:', data);
        setProfile(data);
        setError(null);
      }
    } catch (err) {
      console.error('💥 Error fetching profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    console.log('✏️ Updating profile with:', updates);
    
    if (!user) return { error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Profile updated:', data);
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('💥 Error updating profile:', errorMessage);
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  // Reset fetch state when user changes
  useEffect(() => {
    setFetchAttempted(false);
    setProfile(null);
    setLoading(true);
    setError(null);
  }, [user?.id]);

  // Fetch profile when user is available and not yet attempted
  useEffect(() => {
    if (user?.id && !fetchAttempted) {
      fetchProfile();
    } else if (!user?.id) {
      setLoading(false);
      setProfile(null);
    }
  }, [user?.id, fetchAttempted]);

  // Listen for profile updates with controlled refetch
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('🔄 Profile update event received, refetching...');
      setFetchAttempted(false); // Allow refetch
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('sampleDataCreated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('sampleDataCreated', handleProfileUpdate);
    };
  }, []);

  const refetch = () => {
    setFetchAttempted(false);
    setError(null);
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch
  };
};
