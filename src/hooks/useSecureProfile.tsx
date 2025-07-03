
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SecurityMiddleware } from '@/middleware/securityMiddleware';
import { TokenEncryption } from '@/utils/tokenEncryption';

interface SecureProfile {
  id: string;
  merchant_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  tokenSecurityStatus?: boolean;
}

export const useSecureProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SecureProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [securityValidated, setSecurityValidated] = useState(false);

  const fetchSecureProfile = async () => {
    console.log('🔒 Fetching secure profile for user:', user?.id);
    
    if (!user) {
      console.log('❌ No authenticated user found');
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      // Validate current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No valid session found');
      }

      const tokenValidation = await SecurityMiddleware.validateJWTToken(
        `Bearer ${session.access_token}`
      );
      
      if (!tokenValidation.valid) {
        await SecurityMiddleware.logSecurityEvent({
          type: 'auth_failure',
          details: { reason: tokenValidation.error },
          userId: user.id
        });
        throw new Error('Session validation failed');
      }

      setSecurityValidated(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('📋 Secure profile query result:', { data, error });

      if (error) throw error;
      
      // Check token security status if user has a merchant
      let tokenSecurityStatus = false;
      if (data.merchant_id) {
        tokenSecurityStatus = await TokenEncryption.validateTokenSecurity(data.merchant_id);
        
        if (!tokenSecurityStatus) {
          console.warn('⚠️ Merchant tokens require security update');
        }
      }

      const secureProfile: SecureProfile = {
        ...data,
        tokenSecurityStatus
      };
      
      console.log('✅ Secure profile loaded:', secureProfile);
      setProfile(secureProfile);
      setError(null);
    } catch (err) {
      console.error('💥 Error fetching secure profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setProfile(null);
      
      // Log security event
      await SecurityMiddleware.logSecurityEvent({
        type: 'access_denied',
        details: { error: errorMessage },
        userId: user?.id
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSecureProfile = async (updates: Partial<SecureProfile>) => {
    console.log('✏️ Updating secure profile with:', updates);
    
    if (!user || !securityValidated) {
      return { error: 'No authenticated user or security validation failed' };
    }

    try {
      // Sanitize input data
      const sanitizedUpdates = SecurityMiddleware.sanitizeInput(updates);

      const { data, error } = await supabase
        .from('profiles')
        .update(sanitizedUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Secure profile updated:', data);
      
      // Maintain security status
      const updatedProfile: SecureProfile = {
        ...data,
        tokenSecurityStatus: profile?.tokenSecurityStatus || false
      };
      
      setProfile(updatedProfile);
      return { data: updatedProfile, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('💥 Error updating secure profile:', errorMessage);
      setError(errorMessage);
      
      await SecurityMiddleware.logSecurityEvent({
        type: 'access_denied',
        details: { operation: 'profile_update', error: errorMessage },
        userId: user.id
      });
      
      return { error: errorMessage };
    }
  };

  // Enhanced security monitoring
  useEffect(() => {
    fetchSecureProfile();
    
    // Listen for profile updates with security validation
    const handleSecureProfileUpdate = async () => {
      console.log('🔄 Secure profile update event received, validating...');
      await fetchSecureProfile();
    };
    
    window.addEventListener('profileUpdated', handleSecureProfileUpdate);
    window.addEventListener('sampleDataCreated', handleSecureProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleSecureProfileUpdate);
      window.removeEventListener('sampleDataCreated', handleSecureProfileUpdate);
    };
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    securityValidated,
    updateProfile: updateSecureProfile,
    refetch: fetchSecureProfile
  };
};
