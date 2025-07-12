
import { invokeEdgeFunction } from '@/utils/edgeFunctionHelper';

interface ServerSideWebhookTestPayload {
  merchantId: string;
  webhookUrl: string;
  testPayload?: any;
}

interface ServerSideWebhookTestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: any;
  error?: string;
  url?: string;
  merchantId?: string;
  timestamp?: string;
  testType?: string;
  payloadSize?: number;
}

export class ServerSideWebhookService {
  static async testWebhook(
    merchantId: string, 
    webhookUrl: string, 
    testPayload?: any
  ): Promise<ServerSideWebhookTestResult> {
    console.log(`🚀 Server-side webhook test for merchant: ${merchantId}`);
    console.log(`🌐 Testing URL: ${webhookUrl}`);

    try {
      const result = await invokeEdgeFunction<ServerSideWebhookTestResult>(
        'test-merchant-webhook',
        {
          merchantId,
          webhookUrl,
          testPayload
        }
      );

      if (!result.success) {
        console.error(`❌ Edge function failed: ${result.error}`);
        return {
          success: false,
          error: result.error || 'Edge function failed',
          testType: 'server_side'
        };
      }

      const webhookResult = result.data;
      
      if (webhookResult?.success) {
        console.log(`✅ Server-side webhook test successful: ${webhookResult.status}`);
      } else {
        console.log(`❌ Server-side webhook test failed: ${webhookResult?.status} - ${webhookResult?.error}`);
      }

      return webhookResult || {
        success: false,
        error: 'No response data from edge function',
        testType: 'server_side'
      };

    } catch (error) {
      console.error('💥 Server-side webhook test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown server-side test error',
        testType: 'server_side'
      };
    }
  }

  static async testMultipleEndpoints(
    merchantId: string, 
    webhookUrls: string[]
  ): Promise<ServerSideWebhookTestResult[]> {
    console.log(`🧪 Testing ${webhookUrls.length} webhook endpoints for merchant: ${merchantId}`);

    const results = await Promise.all(
      webhookUrls.map(url => this.testWebhook(merchantId, url))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Server-side test results: ${successCount}/${webhookUrls.length} successful`);

    return results;
  }
}
