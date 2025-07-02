
import type { CreateDataResult } from './types';
import { createSampleMerchants } from './merchants';
import { createSampleReturns } from './returns';
import { createSampleReturnItems } from './returnItems';
import { createSampleAISuggestions } from './aiSuggestions';
import { createSampleAnalytics } from './analytics';
import { createSampleBilling } from './billing';
import { clearAllSampleData } from './clearData';

export const createComprehensiveSampleData = async (): Promise<CreateDataResult> => {
  try {
    console.log('🚀 Starting comprehensive sample data creation...');

    // Only clear if explicitly requested - don't auto-clear to avoid breaking merchant assignments
    // console.log('🧹 Clearing existing data...');
    // const clearResult = await clearAllSampleData();
    // if (!clearResult.success) {
    //   console.warn('⚠️ Warning during data clearing:', clearResult.error);
    //   // Continue anyway - clearing issues shouldn't block creation
    // }

    // Create merchants
    console.log('👥 Creating merchants...');
    const merchants = await createSampleMerchants();
    console.log(`✅ Created ${merchants.length} merchants:`, merchants.map(m => ({ 
      id: m.id, 
      domain: m.shop_domain,
      plan: m.plan_type 
    })));

    if (!merchants || merchants.length === 0) {
      throw new Error('❌ Failed to create merchants - no merchants returned');
    }

    const merchantIds = merchants.map(m => m.id).filter(id => id);
    if (merchantIds.length === 0) {
      throw new Error('❌ No valid merchant IDs found');
    }
    console.log('🔑 Merchant IDs:', merchantIds);

    // Create returns
    console.log('📦 Creating returns...');
    const returns = await createSampleReturns(merchantIds);
    console.log(`✅ Created ${returns.length} returns. Sample returns:`, returns.slice(0, 3).map(r => ({
      id: r.id,
      merchant_id: r.merchant_id,
      order_id: r.shopify_order_id,
      status: r.status,
      amount: r.total_amount
    })));

    if (!returns || returns.length === 0) {
      throw new Error('❌ Failed to create returns - no returns returned');
    }

    // Create return items
    console.log('🛍️ Creating return items...');
    const returnItemsCount = await createSampleReturnItems(returns);
    console.log(`✅ Created ${returnItemsCount} return items`);

    // Create AI suggestions
    console.log('🤖 Creating AI suggestions...');
    const aiSuggestionsCount = await createSampleAISuggestions(returns);
    console.log(`✅ Created ${aiSuggestionsCount} AI suggestions`);

    // Create analytics events
    console.log('📊 Creating analytics events...');
    const analyticsCount = await createSampleAnalytics(merchantIds);
    console.log(`✅ Created ${analyticsCount} analytics events`);

    // Create billing records
    console.log('💳 Creating billing records...');
    const billingCount = await createSampleBilling(merchants);
    console.log(`✅ Created ${billingCount} billing records`);

    const summary = {
      merchants: merchants.length,
      returns: returns.length,
      returnItems: returnItemsCount,
      aiSuggestions: aiSuggestionsCount,
      analyticsEvents: analyticsCount,
      billingRecords: billingCount
    };

    console.log('🎉 Sample data creation completed successfully:', summary);

    return {
      success: true,
      summary
    };

  } catch (error) {
    console.error('💥 Error creating sample data:', error);
    console.error('📍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('🔴 Final error message:', errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

export { clearAllSampleData };
