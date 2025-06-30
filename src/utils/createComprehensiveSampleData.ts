
import { supabase } from '@/integrations/supabase/client';

interface SampleMerchant {
  shop_domain: string;
  access_token: string;
  plan_type: string;
  settings: object;
}

interface SampleReturn {
  merchant_id: string;
  shopify_order_id: string;
  customer_email: string;
  status: 'requested' | 'approved' | 'in_transit' | 'completed';
  reason: string;
  total_amount: number;
  created_at: string;
}

interface SampleReturnItem {
  return_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  action: 'refund' | 'exchange';
}

interface SampleAISuggestion {
  return_id: string;
  suggestion_type: string;
  suggested_product_name: string;
  confidence_score: number;
  reasoning: string;
  accepted: boolean | null;
}

export const createComprehensiveSampleData = async () => {
  try {
    console.log('Starting comprehensive sample data creation...');

    // Sample merchants
    const sampleMerchants: SampleMerchant[] = [
      {
        shop_domain: 'techgear-store.myshopify.com',
        access_token: 'sample_access_token_1',
        plan_type: 'growth',
        settings: { auto_approve_exchanges: true, email_notifications: true }
      },
      {
        shop_domain: 'fashion-boutique.myshopify.com',
        access_token: 'sample_access_token_2',
        plan_type: 'pro',
        settings: { auto_approve_exchanges: false, email_notifications: true }
      },
      {
        shop_domain: 'home-essentials.myshopify.com',
        access_token: 'sample_access_token_3',
        plan_type: 'starter',
        settings: { auto_approve_exchanges: true, email_notifications: false }
      }
    ];

    // Insert merchants
    console.log('Creating merchants...');
    const { data: merchants, error: merchantError } = await supabase
      .from('merchants')
      .insert(sampleMerchants)
      .select();

    if (merchantError) throw merchantError;
    console.log(`Created ${merchants.length} merchants`);

    // Sample returns for each merchant
    const sampleReturns: SampleReturn[] = [];
    const merchantIds = merchants.map(m => m.id);

    const returnReasons = [
      'Defective item - screen not working properly',
      'Wrong size - too small',
      'Not as described - different color than expected',
      'Changed mind - no longer needed',
      'Damaged during shipping',
      'Wrong item received',
      'Quality issues - poor material',
      'Allergic reaction to material'
    ];

    const customerEmails = [
      'sarah.johnson@email.com',
      'mike.chen@gmail.com',
      'emily.davis@outlook.com',
      'alex.rodriguez@yahoo.com',
      'jessica.wilson@email.com',
      'david.brown@gmail.com',
      'lisa.taylor@outlook.com',
      'chris.martinez@email.com',
      'amanda.garcia@gmail.com',
      'ryan.thomas@email.com'
    ];

    const statuses: ('requested' | 'approved' | 'in_transit' | 'completed')[] = [
      'requested', 'approved', 'in_transit', 'completed'
    ];

    // Generate returns for each merchant
    merchantIds.forEach((merchantId, merchantIndex) => {
      for (let i = 0; i < 15; i++) {
        const daysAgo = Math.floor(Math.random() * 60); // Random date within last 60 days
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        sampleReturns.push({
          merchant_id: merchantId,
          shopify_order_id: `ORD-2024-${(merchantIndex * 1000 + i + 1001).toString()}`,
          customer_email: customerEmails[Math.floor(Math.random() * customerEmails.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          reason: returnReasons[Math.floor(Math.random() * returnReasons.length)],
          total_amount: parseFloat((Math.random() * 300 + 20).toFixed(2)),
          created_at: createdAt.toISOString()
        });
      }
    });

    // Insert returns
    console.log('Creating returns...');
    const { data: returns, error: returnsError } = await supabase
      .from('returns')
      .insert(sampleReturns)
      .select();

    if (returnsError) throw returnsError;
    console.log(`Created ${returns.length} returns`);

    // Sample return items
    const sampleReturnItems: SampleReturnItem[] = [];
    const productNames = [
      'Wireless Bluetooth Headphones',
      'Smart Fitness Tracker',
      'Laptop Sleeve - 15 inch',
      'Organic Cotton T-Shirt',
      'Running Shoes - Size 10',
      'Stainless Steel Water Bottle',
      'Wireless Phone Charger',
      'Bluetooth Speaker',
      'Memory Foam Pillow',
      'LED Desk Lamp',
      'Coffee Mug Set',
      'Yoga Mat Premium',
      'Smartphone Case',
      'Portable Power Bank',
      'Essential Oil Diffuser'
    ];

    returns.forEach(returnItem => {
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per return
      for (let i = 0; i < numItems; i++) {
        sampleReturnItems.push({
          return_id: returnItem.id,
          product_id: `PROD-${Math.floor(Math.random() * 10000)}`,
          product_name: productNames[Math.floor(Math.random() * productNames.length)],
          quantity: Math.floor(Math.random() * 2) + 1,
          price: parseFloat((Math.random() * 150 + 10).toFixed(2)),
          action: Math.random() > 0.6 ? 'exchange' : 'refund'
        });
      }
    });

    console.log('Creating return items...');
    const { error: itemsError } = await supabase
      .from('return_items')
      .insert(sampleReturnItems);

    if (itemsError) throw itemsError;
    console.log(`Created ${sampleReturnItems.length} return items`);

    // Sample AI suggestions
    const sampleAISuggestions: SampleAISuggestion[] = [];
    const suggestionProducts = [
      'Premium Wireless Earbuds',
      'Advanced Fitness Watch',
      'Professional Laptop Case',
      'Bamboo Fiber T-Shirt',
      'Trail Running Shoes',
      'Insulated Tumbler',
      'Fast Wireless Charger',
      'Portable Bluetooth Speaker',
      'Ergonomic Pillow',
      'Adjustable LED Light',
      'Ceramic Mug Collection',
      'Premium Exercise Mat',
      'Protective Phone Cover',
      'High-Capacity Battery Pack',
      'Ultrasonic Aromatherapy Device'
    ];

    const reasoningTemplates = [
      'Based on customer purchase history and product compatibility, this item offers similar functionality with improved features.',
      'Customer has shown preference for premium alternatives in this category, with 92% satisfaction rate.',
      'This recommendation aligns with seasonal trends and customer demographic preferences.',
      'Product compatibility analysis indicates this item would better meet the customer\'s stated needs.',
      'Similar customers who returned this item were satisfied with this alternative 89% of the time.'
    ];

    returns.forEach(returnItem => {
      if (Math.random() > 0.3) { // 70% chance of AI suggestion
        sampleAISuggestions.push({
          return_id: returnItem.id,
          suggestion_type: 'product_exchange',
          suggested_product_name: suggestionProducts[Math.floor(Math.random() * suggestionProducts.length)],
          confidence_score: Math.floor(Math.random() * 30) + 70, // 70-99% confidence
          reasoning: reasoningTemplates[Math.floor(Math.random() * reasoningTemplates.length)],
          accepted: Math.random() > 0.4 ? (Math.random() > 0.7 ? true : false) : null
        });
      }
    });

    console.log('Creating AI suggestions...');
    const { error: suggestionsError } = await supabase
      .from('ai_suggestions')
      .insert(sampleAISuggestions);

    if (suggestionsError) throw suggestionsError;
    console.log(`Created ${sampleAISuggestions.length} AI suggestions`);

    // Sample analytics events
    const eventTypes = [
      'return_submitted',
      'return_approved',
      'return_rejected',
      'exchange_completed',
      'ai_suggestion_accepted',
      'ai_suggestion_rejected',
      'refund_processed'
    ];

    const analyticsEvents = [];
    merchantIds.forEach(merchantId => {
      for (let i = 0; i < 25; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() - daysAgo);

        analyticsEvents.push({
          merchant_id: merchantId,
          event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          event_data: {
            value: Math.floor(Math.random() * 200) + 20,
            source: 'dashboard'
          },
          created_at: eventDate.toISOString()
        });
      }
    });

    console.log('Creating analytics events...');
    const { error: analyticsError } = await supabase
      .from('analytics_events')
      .insert(analyticsEvents);

    if (analyticsError) throw analyticsError;
    console.log(`Created ${analyticsEvents.length} analytics events`);

    // Create sample billing records
    const billingRecords = merchants.map(merchant => ({
      merchant_id: merchant.id,
      plan_type: merchant.plan_type,
      usage_count: Math.floor(Math.random() * 50) + 10,
      stripe_customer_id: `cus_sample_${merchant.id.slice(0, 8)}`,
      current_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }));

    console.log('Creating billing records...');
    const { error: billingError } = await supabase
      .from('billing_records')
      .insert(billingRecords);

    if (billingError) throw billingError;
    console.log(`Created ${billingRecords.length} billing records`);

    return {
      success: true,
      summary: {
        merchants: merchants.length,
        returns: returns.length,
        returnItems: sampleReturnItems.length,
        aiSuggestions: sampleAISuggestions.length,
        analyticsEvents: analyticsEvents.length,
        billingRecords: billingRecords.length
      }
    };

  } catch (error) {
    console.error('Error creating sample data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const clearAllSampleData = async () => {
  try {
    console.log('Clearing all sample data...');

    // Delete in reverse order to respect foreign key constraints
    await supabase.from('analytics_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('billing_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('ai_suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('return_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('returns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('merchants').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('All sample data cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('Error clearing sample data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
