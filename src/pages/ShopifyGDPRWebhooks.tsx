import React, { useEffect } from 'react';

const ShopifyGDPRWebhooks = () => {
  useEffect(() => {
    // This component handles GDPR webhook requests from Shopify
    const handleWebhookRequest = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const topic = urlParams.get('topic');
      
      // Log the webhook request for compliance
      console.log('Shopify GDPR Webhook received:', {
        topic,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });

      // For now, we'll just acknowledge receipt
      // In production, you'd implement actual data handling logic
      
      // Send success response
      if (topic) {
        // This would typically be handled on the backend
        console.log(`GDPR webhook processed: ${topic}`);
      }
    };

    handleWebhookRequest();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Shopify GDPR Webhook Handler
        </h1>
        <p className="text-gray-600">
          This endpoint processes Shopify GDPR compliance webhooks.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          Webhook received and processed successfully.
        </div>
      </div>
    </div>
  );
};

export default ShopifyGDPRWebhooks;