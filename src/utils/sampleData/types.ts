
export interface SampleMerchant {
  shop_domain: string;
  access_token: string;
  plan_type: string;
  settings: any;
}

export interface SampleReturn {
  merchant_id: string;
  shopify_order_id: string;
  customer_email: string;
  status: 'requested' | 'approved' | 'in_transit' | 'completed';
  reason: string;
  total_amount: number;
  created_at: string;
}

export interface SampleReturnItem {
  return_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  action: 'refund' | 'exchange';
}

export interface SampleAISuggestion {
  return_id: string;
  suggestion_type: string;
  suggested_product_name: string;
  confidence_score: number;
  reasoning: string;
  accepted: boolean | null;
}

export interface CreateDataResult {
  success: boolean;
  summary?: {
    merchants: number;
    returns: number;
    returnItems: number;
    aiSuggestions: number;
    analyticsEvents: number;
    billingRecords: number;
  };
  error?: string;
}
