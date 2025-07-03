
import { supabase } from '@/integrations/supabase/client';

// Token encryption utilities for sensitive data
export class TokenEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;

  // Generate a secure encryption key (should be stored in environment)
  private static async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt sensitive tokens before storage
  static async encryptToken(token: string): Promise<{ encryptedToken: string; iv: string }> {
    try {
      const key = await this.generateKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encodedToken = new TextEncoder().encode(token);
      
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encodedToken
      );

      return {
        encryptedToken: Array.from(new Uint8Array(encryptedBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        iv: Array.from(iv)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      };
    } catch (error) {
      console.error('Token encryption failed:', error);
      throw new Error('Failed to encrypt token');
    }
  }

  // Store encrypted token with metadata
  static async storeEncryptedToken(merchantId: string, token: string): Promise<void> {
    try {
      const { encryptedToken } = await this.encryptToken(token);
      
      const { error } = await supabase
        .from('merchants')
        .update({
          access_token: encryptedToken,
          token_encrypted_at: new Date().toISOString(),
          token_encryption_version: 1
        })
        .eq('id', merchantId);

      if (error) {
        console.error('Failed to store encrypted token:', error);
        throw error;
      }

      console.log('✅ Token encrypted and stored successfully');
    } catch (error) {
      console.error('Token storage failed:', error);
      throw error;
    }
  }

  // Validate token encryption status
  static async validateTokenSecurity(merchantId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('token_encrypted_at, token_encryption_version')
        .eq('id', merchantId)
        .single();

      if (error) {
        console.error('Token validation failed:', error);
        return false;
      }

      // Check if token was encrypted recently (within last 30 days)
      const encryptedAt = new Date(data.token_encrypted_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      return encryptedAt > thirtyDaysAgo && data.token_encryption_version >= 1;
    } catch (error) {
      console.error('Token security validation failed:', error);
      return false;
    }
  }
}
