
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

// Global state to prevent duplicate fetches
let isProfileFetching = false;
let currentFetchUserId: string | null = null;

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const fetchProfile = async (userId: string) => {
    // Prevent duplicate fetches for the same user
    if (isProfileFetching && currentFetchUserId === userId) {
      console.log('⏭️ Profile fetch already in progress for user:', userId);
      return;
    }

    console.log('👤 Starting profile fetch for user:', userId);
    isProfileFetching = true;
    currentFetchUserId = userId;
    
    try {
      setLoading(true);
      setError(null);
      
      // Shorter timeout for faster feedback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('⏰ Profile fetch timed out after 3 seconds');
      }, 3000);

      console.log('🔍 Executing Supabase query...');
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .maybeSingle();

      clearTimeout(timeoutId);
      console.log('📋 Profile query completed:', { data, error: fetchError, hasData: !!data });

      if (fetchError) {
        console.error('💥 Profile fetch error:', fetchError);
        setError(fetchError.message);
        setProfile(null);
      } else if (data) {
        console.log('✅ Profile loaded successfully:', data);
        setProfile(data);
        setError(null);
      } else {
        console.log('ℹ️ No profile found - user needs to create one');
        setProfile(null);
        setError(null);
      }
    } catch (err) {
      console.error('💥 Unexpected error in profile fetch:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🚫 Query was aborted due to timeout');
        setError('Database connection timeout. Please refresh the page.');
        setProfile(null);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setProfile(null);
      }
    } finally {
      isProfileFetching = false;
      currentFetchUserId = null;
      setLoading(false);
      setFetchAttempted(true);
      console.log('🏁 Profile fetch completed, loading set to false');
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    console.log('✏️ Updating profile with:', updates);
    
    if (!user) {
      const errorMsg = 'No user logged in';
      console.error('💥 Profile update failed:', errorMsg);
      return { error: errorMsg };
    }

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('💥 Profile update error:', updateError);
        setError(updateError.message);
        return { error: updateError.message };
      }
      
      console.log('✅ Profile updated successfully:', data);
      setProfile(data);
      setError(null);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('💥 Unexpected error in profile update:', errorMessage);
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  // Reset state when user changes
  useEffect(() => {
    console.log('🔄 User changed, resetting profile state. New user:', user?.id || 'none');
    setProfile(null);
    setLoading(true);
    setError(null);
    setFetchAttempted(false);
  }, [user?.id]);

  // Fetch profile when user is available and not yet attempted
  useEffect(() => {
    if (!user?.id) {
      console.log('⏭️ No user ID, skipping profile fetch');
      setLoading(false);
      setFetchAttempted(true);
      return;
    }

    if (fetchAttempted) {
      console.log('⏭️ Profile fetch already attempted, skipping');
      return;
    }

    console.log('🚀 Triggering profile fetch for user:', user.id);
    fetchProfile(user.id);
  }, [user?.id, fetchAttempted]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('🔄 Profile update event received, allowing refetch...');
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
    console.log('🔄 Manual refetch requested');
    if (user?.id) {
      setFetchAttempted(false);
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
