/**
 * CSP Helpers for Shopify Embedded Apps
 * Utilities for managing Content Security Policy in embedded context
 */

/**
 * Check if current context allows embedded app features
 */
export const isEmbeddedContextAllowed = (): boolean => {
  try {
    // Check if we're in an iframe
    const inIframe = window !== window.top;
    
    if (!inIframe) {
      return true; // Not in iframe, allowed
    }

    // Check if parent origin is Shopify
    const referrer = document.referrer;
    const isShopifyReferrer = referrer.includes('shopify.com') || referrer.includes('shopifycloud.com');
    
    return isShopifyReferrer;
  } catch (error) {
    // Cross-origin error means we're in iframe but can't access parent
    // This is expected in embedded apps
    return true;
  }
};

/**
 * Validate that CSP allows Shopify embedding
 */
export const validateCSPForEmbedding = (): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check if CSP headers exist
  const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
  
  if (metaTags.length === 0) {
    issues.push('No CSP meta tag found');
    return { valid: false, issues };
  }

  const cspContent = metaTags[0].getAttribute('content') || '';
  
  if (!cspContent.includes('frame-ancestors')) {
    issues.push('CSP missing frame-ancestors directive');
  }
  
  if (!cspContent.includes('shopify.com')) {
    issues.push('CSP frame-ancestors does not include shopify.com');
  }

  return {
    valid: issues.length === 0,
    issues
  };
};