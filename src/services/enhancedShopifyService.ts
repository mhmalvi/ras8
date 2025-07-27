import { supabase } from '@/integrations/supabase/client';
import { ShopifyValidationResult, ShopifyOrderLookupResult } from '@/types/ShopifyTypes';

export class EnhancedShopifyService {
  static async validateIntegration(
    shopDomain: string,
    accessToken: string,
    testType: string = 'full'
  ): Promise<ShopifyValidationResult> {
    const { data, error } = await supabase.functions.invoke('shopify-integration-validator', {
      body: { shopDomain, accessToken, testType }
    });
    if (error) throw new Error(`Validation failed: ${error.message}`);
    return data;
  }

  static async lookupOrder(
    orderNumber: string,
    customerEmail: string,
    shopDomain?: string,
    accessToken?: string
  ): Promise<ShopifyOrderLookupResult> {
    const { data, error } = await supabase.functions.invoke('shopify-order-lookup', {
      body: { orderNumber, customerEmail, shopDomain, accessToken }
    });
    if (error) throw new Error(`Order lookup failed: ${error.message}`);
    return data;
  }
}