
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
    console.log('Starting comprehensive sample data creation...');

    // First, clear any existing sample data to avoid conflicts
    await clearAllSampleData();

    // Create merchants
    console.log('Creating merchants...');
    const merchants = await createSampleMerchants();
    console.log(`Created ${merchants.length} merchants`);

    const merchantIds = merchants.map(m => m.id);

    // Create returns
    console.log('Creating returns...');
    const returns = await createSampleReturns(merchantIds);
    console.log(`Created ${returns.length} returns`);

    // Create return items
    console.log('Creating return items...');
    const returnItemsCount = await createSampleReturnItems(returns);
    console.log(`Created ${returnItemsCount} return items`);

    // Create AI suggestions
    console.log('Creating AI suggestions...');
    const aiSuggestionsCount = await createSampleAISuggestions(returns);
    console.log(`Created ${aiSuggestionsCount} AI suggestions`);

    // Create analytics events
    console.log('Creating analytics events...');
    const analyticsCount = await createSampleAnalytics(merchantIds);
    console.log(`Created ${analyticsCount} analytics events`);

    // Create billing records
    console.log('Creating billing records...');
    const billingCount = await createSampleBilling(merchants);
    console.log(`Created ${billingCount} billing records`);

    return {
      success: true,
      summary: {
        merchants: merchants.length,
        returns: returns.length,
        returnItems: returnItemsCount,
        aiSuggestions: aiSuggestionsCount,
        analyticsEvents: analyticsCount,
        billingRecords: billingCount
      }
    };

  } catch (error) {
    console.error('Error creating sample data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export { clearAllSampleData };
