
import { supabase } from "@/integrations/supabase/client";

export const createSampleDataForMerchant = async (merchantId: string) => {
  try {
    // Create sample returns
    const sampleReturns = [
      {
        merchant_id: merchantId,
        shopify_order_id: '1001',
        customer_email: 'sarah.johnson@email.com',
        reason: 'Defective item',
        status: 'requested',
        total_amount: 129.99
      },
      {
        merchant_id: merchantId,
        shopify_order_id: '1002',
        customer_email: 'mike.chen@email.com',
        reason: 'Wrong size',
        status: 'approved',
        total_amount: 89.50
      },
      {
        merchant_id: merchantId,
        shopify_order_id: '1003',
        customer_email: 'emma.davis@email.com',
        reason: 'Not as described',
        status: 'in_transit',
        total_amount: 249.99
      },
      {
        merchant_id: merchantId,
        shopify_order_id: '1004',
        customer_email: 'alex.martinez@email.com',
        reason: 'Changed mind',
        status: 'completed',
        total_amount: 64.99
      }
    ];

    const { data: returns, error: returnsError } = await supabase
      .from('returns')
      .insert(sampleReturns)
      .select();

    if (returnsError) throw returnsError;

    // Create sample return items
    if (returns && returns.length > 0) {
      const sampleReturnItems = [
        {
          return_id: returns[0].id,
          product_id: 'prod_001',
          product_name: 'Wireless Headphones',
          quantity: 1,
          price: 129.99,
          action: 'refund'
        },
        {
          return_id: returns[1].id,
          product_id: 'prod_002',
          product_name: 'Running Shoes',
          quantity: 1,
          price: 89.50,
          action: 'exchange'
        },
        {
          return_id: returns[2].id,
          product_id: 'prod_003',
          product_name: 'Smart Watch',
          quantity: 1,
          price: 249.99,
          action: 'refund'
        },
        {
          return_id: returns[3].id,
          product_id: 'prod_004',
          product_name: 'Bluetooth Speaker',
          quantity: 1,
          price: 64.99,
          action: 'refund'
        }
      ];

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(sampleReturnItems);

      if (itemsError) throw itemsError;

      // Create sample AI suggestions
      const sampleAISuggestions = [
        {
          return_id: returns[0].id,
          suggested_product_name: 'Premium Wireless Earbuds',
          suggestion_type: 'exchange',
          confidence_score: 92,
          reasoning: 'Similar audio product with better portability'
        },
        {
          return_id: returns[1].id,
          suggested_product_name: 'Cross-Training Shoes',
          suggestion_type: 'exchange',
          confidence_score: 88,
          reasoning: 'Better fit for versatile athletic activities'
        },
        {
          return_id: returns[2].id,
          suggested_product_name: 'Fitness Tracker Pro',
          suggestion_type: 'exchange',
          confidence_score: 85,
          reasoning: 'More accurate health monitoring features'
        }
      ];

      const { error: aiError } = await supabase
        .from('ai_suggestions')
        .insert(sampleAISuggestions);

      if (aiError) throw aiError;
    }

    console.log('Sample data created successfully for merchant:', merchantId);
    return { success: true };
    
  } catch (error) {
    console.error('Error creating sample data:', error);
    return { success: false, error };
  }
};
