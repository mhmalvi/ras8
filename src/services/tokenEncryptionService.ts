import { supabase } from '@/integrations/supabase/client';

/**
 * Token Encryption Service
 * Handles encryption/decryption of sensitive tokens like Shopify access tokens
 */
export class TokenEncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  
  /**
   * Generate a cryptographic key for encryption
   */
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive a key from a password/secret
   */
  private static async deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a token using AES-GCM
   */
  static async encryptToken(token: string, encryptionSecret: string): Promise<{
    encryptedData: string;
    salt: string;
    iv: string;
  }> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derive key from secret
      const key = await this.deriveKey(encryptionSecret, salt);
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        data
      );

      // Convert to base64 for storage
      const encryptedArray = new Uint8Array(encrypted);
      const encryptedData = btoa(String.fromCharCode(...encryptedArray));
      const saltB64 = btoa(String.fromCharCode(...salt));
      const ivB64 = btoa(String.fromCharCode(...iv));

      return {
        encryptedData,
        salt: saltB64,
        iv: ivB64
      };
    } catch (error) {
      console.error('Token encryption failed:', error);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt a token using AES-GCM
   */
  static async decryptToken(
    encryptedData: string,
    salt: string,
    iv: string,
    encryptionSecret: string
  ): Promise<string> {
    try {
      // Convert from base64
      const encrypted = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      const saltArray = new Uint8Array(
        atob(salt).split('').map(char => char.charCodeAt(0))
      );
      const ivArray = new Uint8Array(
        atob(iv).split('').map(char => char.charCodeAt(0))
      );

      // Derive key from secret
      const key = await this.deriveKey(encryptionSecret, saltArray);

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: ivArray,
        },
        key,
        encrypted
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Token decryption failed:', error);
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Store encrypted token in database
   */
  static async storeEncryptedToken(
    merchantId: string,
    token: string,
    encryptionSecret: string
  ): Promise<void> {
    try {
      const { encryptedData, salt, iv } = await this.encryptToken(token, encryptionSecret);
      
      const { error } = await supabase
        .from('merchants')
        .update({
          access_token: encryptedData,
          token_encrypted_at: new Date().toISOString(),
          token_encryption_version: 2,
          settings: {
            encryption_salt: salt,
            encryption_iv: iv
          }
        })
        .eq('id', merchantId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store encrypted token:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt token from database
   */
  static async retrieveDecryptedToken(
    merchantId: string,
    encryptionSecret: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('access_token, settings, token_encryption_version')
        .eq('id', merchantId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Check if token is encrypted
      if (data.token_encryption_version === 2) {
        const settings = data.settings as any;
        if (!settings?.encryption_salt || !settings?.encryption_iv) {
          throw new Error('Missing encryption metadata');
        }

        return await this.decryptToken(
          data.access_token,
          settings.encryption_salt,
          settings.encryption_iv,
          encryptionSecret
        );
      }

      // Legacy unencrypted token
      return data.access_token;
    } catch (error) {
      console.error('Failed to retrieve decrypted token:', error);
      return null;
    }
  }

  /**
   * Migrate legacy unencrypted tokens to encrypted format
   */
  static async migrateLegacyToken(
    merchantId: string,
    encryptionSecret: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('access_token, token_encryption_version')
        .eq('id', merchantId)
        .single();

      if (error) throw error;
      if (!data) return { success: false, error: 'Merchant not found' };

      // Skip if already encrypted
      if (data.token_encryption_version === 2) {
        return { success: true };
      }

      // Encrypt the legacy token
      await this.storeEncryptedToken(merchantId, data.access_token, encryptionSecret);
      
      console.log(`✅ Migrated token encryption for merchant ${merchantId}`);
      return { success: true };
    } catch (error) {
      console.error('Token migration failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Migration failed' 
      };
    }
  }
}