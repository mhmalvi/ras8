
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/utils/edgeFunctionHelper';

export interface MerchantData {
  id: string;
  shop_domain: string;
  plan_type: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface MerchantProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  merchant_id?: string;
}

export class MerchantService {
  /**
   * Get current user's merchant data
   */
  static async getCurrentMerchant(): Promise<MerchantData | null> {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching current merchant:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user profile with merchant assignment
   */
  static async getUserProfile(): Promise<MerchantProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Create new merchant
   */
  static async createMerchant(merchantData: {
    shop_domain: string;
    access_token: string;
    plan_type?: string;
    settings?: any;
  }): Promise<MerchantData> {
    const { data, error } = await supabase
      .from('merchants')
      .insert({
        shop_domain: merchantData.shop_domain,
        access_token: merchantData.access_token,
        plan_type: merchantData.plan_type || 'starter',
        settings: merchantData.settings || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create merchant: ${error.message}`);
    }

    return data;
  }

  /**
   * Update merchant settings
   */
  static async updateMerchantSettings(merchantId: string, settings: any): Promise<void> {
    const { error } = await supabase
      .from('merchants')
      .update({ 
        settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', merchantId);

    if (error) {
      throw new Error(`Failed to update merchant settings: ${error.message}`);
    }
  }

  /**
   * Assign user to merchant
   */
  static async assignUserToMerchant(userId: string, merchantId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        merchant_id: merchantId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to assign user to merchant: ${error.message}`);
    }
  }

  /**
   * Test Shopify connection for merchant
   */
  static async testShopifyConnection(merchantId: string) {
    return invokeEdgeFunction('shopify-connection-test', { merchantId });
  }
}
