
import { supabase } from "@/integrations/supabase/client";

export const syncSampleData = async () => {
  try {
    // First, let's create a sample merchant if one doesn't exist
    const { data: existingMerchant } = await supabase
      .from('merchants')
      .select('id')
      .limit(1)
      .single();

    let merchantId = existingMerchant?.id;

    if (!merchantId) {
      const { data: newMerchant, error: merchantError } = await supabase
        .from('merchants')
        .insert({
          shop_domain: 'demo-store.myshopify.com',
          access_token: 'demo_token_123',
          plan_type: 'starter',
          settings: { theme_color: '#1D4ED8' }
        })
        .select('id')
        .single();

      if (merchantError) throw merchantError;
      merchantId = newMerchant.id;
    }

    // Sample returns data
    const sampleReturns = [
      {
        merchant_id: merchantId,
        shopify_order_id: '5001',
        customer_email: 'sarah.johnson@email.com',
        reason: 'Defective item',
        status: 'requested',
        total_amount: 129.99
      },
      {
        merchant_id: merchantId,
        shopify_order_id: '5002',
        customer_email: 'mike.chen@email.com',
        reason: 'Wrong size',
        status: 'approved',
        total_amount: 89.50
      },
      {
        merchant_id: merchantId,
        shopify_order_id: '5003',
        customer_email: 'emma.davis@email.com',
        reason: 'Not as described',
        status: 'in_transit',
        total_amount: 249.99
      },
      {
        merchant_id: merchantId,
        shopify_order_id: '5004',
        customer_email: 'alex.martinez@email.com',
        reason: 'Changed mind',
        status: 'completed',
        total_amount: 64.99
      },
      {
        merchant_id: merchantId,
        shopify_order_id: '5005',
        customer_email: 'lisa.wong@email.com',
        reason: 'Wrong color',
        status: 'requested',
        total_amount: 199.99
      }
    ];

    // Insert returns
    const { data: insertedReturns, error: returnsError } = await supabase
      .from('returns')
      .insert(sampleReturns)
      .select('id');

    if (returnsError) throw returnsError;

    // Sample return items for each return
    const sampleReturnItems = [
      {
        return_id: insertedReturns[0].id,
        product_id: 'prod_001',
        product_name: 'Wireless Headphones',
        quantity: 1,
        price: 129.99,
        action: 'refund'
      },
      {
        return_id: insertedReturns[1].id,
        product_id: 'prod_002',
        product_name: 'Running Shoes',
        quantity: 1,
        price: 89.50,
        action: 'exchange'
      },
      {
        return_id: insertedReturns[2].id,
        product_id: 'prod_003',
        product_name: 'Smart Watch',
        quantity: 1,
        price: 249.99,
        action: 'refund'
      },
      {
        return_id: insertedReturns[3].id,
        product_id: 'prod_004',
        product_name: 'Bluetooth Speaker',
        quantity: 1,
        price: 64.99,
        action: 'refund'
      },
      {
        return_id: insertedReturns[4].id,
        product_id: 'prod_005',
        product_name: 'Laptop Backpack',
        quantity: 1,
        price: 199.99,
        action: 'exchange'
      }
    ];

    // Insert return items
    const { error: itemsError } = await supabase
      .from('return_items')
      .insert(sampleReturnItems);

    if (itemsError) throw itemsError;

    // Sample AI suggestions
    const sampleAISuggestions = [
      {
        return_id: insertedReturns[0].id,
        suggested_product_name: 'Premium Wireless Earbuds',
        suggestion_type: 'exchange',
        confidence_score: 92,
        reasoning: 'Similar audio product with better portability'
      },
      {
        return_id: insertedReturns[1].id,
        suggested_product_name: 'Cross-Training Shoes',
        suggestion_type: 'exchange',
        confidence_score: 88,
        reasoning: 'Better fit for versatile athletic activities'
      },
      {
        return_id: insertedReturns[2].id,
        suggested_product_name: 'Fitness Tracker Pro',
        suggestion_type: 'exchange',
        confidence_score: 85,
        reasoning: 'More accurate health monitoring features'
      },
      {
        return_id: insertedReturns[3].id,
        suggested_product_name: 'Portable Sound System',
        suggestion_type: 'exchange',
        confidence_score: 78,
        reasoning: 'Enhanced audio experience for outdoor activities'
      },
      {
        return_id: insertedReturns[4].id,
        suggested_product_name: 'Professional Laptop Bag',
        suggestion_type: 'exchange',
        confidence_score: 94,
        reasoning: 'Better organization and professional appearance'
      }
    ];

    // Insert AI suggestions
    const { error: aiError } = await supabase
      .from('ai_suggestions')
      .insert(sampleAISuggestions);

    if (aiError) throw aiError;

    console.log('Sample data synced successfully!');
    return { success: true, message: 'Database synced with sample data' };

  } catch (error) {
    console.error('Error syncing sample data:', error);
    return { success: false, error: error.message };
  }
};
