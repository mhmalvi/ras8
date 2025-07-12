
import { ServerSideWebhookService } from '@/services/serverSideWebhookService';

interface WebhookTestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: any;
  error?: string;
  url?: string;
  merchantId?: string;
  timestamp?: string;
  testType?: 'server_side' | 'browser_based';
  payloadSize?: number;
}

interface WebhookTestOptions {
  preferServerSide?: boolean;
  fallbackToBrowser?: boolean;
  testPayload?: any;
  headers?: Record<string, string>;
}

export class UnifiedWebhookService {
  static async testWebhook(
    merchantId: string,
    webhookUrl: string,
    options: WebhookTestOptions = {}
  ): Promise<WebhookTestResult> {
    const {
      preferServerSide = true,
      fallbackToBrowser = true,
      testPayload,
      headers = {}
    } = options;

    console.log(`🧪 Testing webhook with unified service for merchant: ${merchantId}`);
    console.log(`🌐 URL: ${webhookUrl}`);
    console.log(`⚙️ Options:`, { preferServerSide, fallbackToBrowser });

    // Try server-side testing first if preferred
    if (preferServerSide) {
      try {
        console.log(`🚀 Attempting server-side test for: ${webhookUrl}`);
        const serverResult = await ServerSideWebhookService.testWebhook(
          merchantId,
          webhookUrl,
          testPayload
        );

        if (serverResult.success) {
          console.log(`✅ Server-side test successful for: ${webhookUrl}`);
          return {
            ...serverResult,
            testType: 'server_side'
          };
        } else {
          console.log(`⚠️ Server-side test failed: ${serverResult.error}`);
          if (!fallbackToBrowser) {
            return serverResult;
          }
        }
      } catch (error) {
        console.log(`💥 Server-side test error: ${error}`);
        if (!fallbackToBrowser) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Server-side test failed',
            testType: 'server_side',
            timestamp: new Date().toISOString()
          };
        }
      }
    }

    // Fallback to browser-based testing
    if (fallbackToBrowser || !preferServerSide) {
      console.log(`🌐 Attempting browser-based test for: ${webhookUrl}`);
      return this.browserBasedTest(merchantId, webhookUrl, testPayload, headers);
    }

    return {
      success: false,
      error: 'All testing methods failed',
      testType: 'server_side',
      timestamp: new Date().toISOString()
    };
  }

  private static async browserBasedTest(
    merchantId: string,
    webhookUrl: string,
    testPayload?: any,
    customHeaders: Record<string, string> = {}
  ): Promise<WebhookTestResult> {
    const defaultPayload = {
      event: "webhook_test",
      version: "2.0",
      timestamp: new Date().toISOString(),
      source: "returns_automation_saas",
      merchantId: merchantId,
      tenantIsolated: true,
      testType: 'browser_based',
      
      orderDetails: {
        id: "test-order-123",
        order_number: "#TEST1001",
        email: "test.customer@example.com",
        total_price: "149.99",
        currency: "USD",
        status: "paid"
      },
      
      customerDetails: {
        id: "test-customer-456",
        email: "test.customer@example.com",
        first_name: "John",
        last_name: "Doe"
      },
      
      metadata: {
        webhook_id: `browser_test_${Date.now()}`,
        merchant_id: merchantId,
        tenant_isolated: true,
        test_mode: true
      }
    };

    const finalPayload = testPayload || defaultPayload;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'returns-automation-saas',
          'X-Webhook-Version': '2.0',
          'X-Merchant-ID': merchantId,
          'X-Tenant-ID': merchantId,
          'X-Test-Type': 'browser-based',
          ...customHeaders
        },
        body: JSON.stringify(finalPayload),
        mode: 'cors'
      });

      let responseData;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : { raw: text };
      } catch {
        responseData = { message: 'No response body or invalid JSON' };
      }

      const result: WebhookTestResult = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        url: webhookUrl,
        merchantId: merchantId,
        timestamp: new Date().toISOString(),
        testType: 'browser_based',
        payloadSize: JSON.stringify(finalPayload).length
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        console.log(`❌ Browser-based test failed: ${result.error}`);
      } else {
        console.log(`✅ Browser-based test successful: ${response.status}`);
      }

      return result;

    } catch (error) {
      console.log(`💥 Browser-based test error: ${error}`);
      
      // Handle CORS errors gracefully
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'CORS error - browser blocked the request. Try server-side testing instead.',
          testType: 'browser_based',
          timestamp: new Date().toISOString(),
          url: webhookUrl,
          merchantId: merchantId
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Browser-based test failed',
        testType: 'browser_based',
        timestamp: new Date().toISOString(),
        url: webhookUrl,
        merchantId: merchantId
      };
    }
  }

  static async testMultipleWebhooks(
    merchantId: string,
    webhookUrls: string[],
    options: WebhookTestOptions = {}
  ): Promise<WebhookTestResult[]> {
    console.log(`🧪 Testing ${webhookUrls.length} webhooks for merchant: ${merchantId}`);

    const results = await Promise.all(
      webhookUrls.map(url => this.testWebhook(merchantId, url, options))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Unified test results: ${successCount}/${webhookUrls.length} successful`);

    return results;
  }
}
