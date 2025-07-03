
import { supabase } from '@/integrations/supabase/client';
import { TokenEncryption } from './tokenEncryption';

export class TokenMigration {
  // Migrate all unencrypted merchant tokens
  static async migrateAllTokens(): Promise<{
    success: boolean;
    migrated: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      migrated: 0,
      errors: [] as string[]
    };

    try {
      // Get all merchants with potentially unencrypted tokens
      const { data: merchants, error } = await supabase
        .from('merchants')
        .select('id, access_token')
        .order('created_at', { ascending: true });

      if (error) {
        results.success = false;
        results.errors.push(`Failed to fetch merchants: ${error.message}`);
        return results;
      }

      if (!merchants || merchants.length === 0) {
        return results;
      }

      // Process each merchant
      for (const merchant of merchants) {
        try {
          // Check if token is already encrypted
          const isSecure = await TokenEncryption.validateTokenSecurity(merchant.id);
          
          if (!isSecure && merchant.access_token) {
            console.log(`🔐 Encrypting token for merchant: ${merchant.id}`);
            
            // Encrypt and store the token
            await TokenEncryption.storeEncryptedToken(merchant.id, merchant.access_token);
            results.migrated++;
            
            // Small delay to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          const errorMsg = `Merchant ${merchant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          console.error('❌ Token migration error:', errorMsg);
        }
      }

      console.log(`✅ Token migration completed: ${results.migrated} tokens encrypted`);
      
      if (results.errors.length > 0) {
        results.success = false;
      }

    } catch (error) {
      results.success = false;
      results.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  // Get migration status summary
  static async getMigrationStatus(): Promise<{
    total: number;
    encrypted: number;
    pending: number;
  }> {
    try {
      const { data: merchants, error } = await supabase
        .from('merchants')
        .select('id')
        .order('created_at', { ascending: true });

      if (error || !merchants) {
        return { total: 0, encrypted: 0, pending: 0 };
      }

      let encrypted = 0;
      
      // Check encryption status for each merchant
      for (const merchant of merchants) {
        const isSecure = await TokenEncryption.validateTokenSecurity(merchant.id);
        if (isSecure) {
          encrypted++;
        }
      }

      return {
        total: merchants.length,
        encrypted,
        pending: merchants.length - encrypted
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return { total: 0, encrypted: 0, pending: 0 };
    }
  }
}
