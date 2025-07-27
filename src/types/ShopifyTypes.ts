export interface ShopifyValidationTest {
  name: string;
  description: string;
  status: 'pending' | 'success' | 'failed' | 'warning';
  details?: any;
  errorMessage?: string;
  duration?: number;
}

export interface ShopifyValidationResult {
  success: boolean;
  overallStatus: 'success' | 'warning' | 'failed';
  shopDomain: string;
  testType: string;
  totalDuration: number;
  timestamp: string;
  tests: ShopifyValidationTest[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

export interface ShopifyOrderData {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

export interface ShopifyOrderLookupResult {
  success: boolean;
  order?: ShopifyOrderData;
  error?: string;
  message?: string;
}