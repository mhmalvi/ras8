import React, { useState, useEffect } from 'react';
import { useAppBridge } from '@/components/AppBridgeProvider';
import { 
  detectShopDomain, 
  startOAuthFlow, 
  validateShopDomain, 
  ensureShopifyDomain,
  trackInstallationStep,
  checkExistingInstallation,
  getInstallationState,
  updateInstallationState,
  type ShopInfo,
  type InstallationState
} from '@/utils/shopifyInstallation';

const ShopifyInstallEnhanced = () => {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [manualShop, setManualShop] = useState('');
  const [installationState, setInstallationState] = useState<InstallationState>(getInstallationState());
  const [showManualInput, setShowManualInput] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { isEmbedded } = useAppBridge();

  useEffect(() => {
    initializeInstallation();
    
    // Listen for installation state changes
    const handleStateChange = (event: CustomEvent) => {
      setInstallationState(event.detail);
    };
    
    window.addEventListener('installationStateChange', handleStateChange as EventListener);
    return () => window.removeEventListener('installationStateChange', handleStateChange as EventListener);
  }, []);

  const initializeInstallation = async () => {
    updateInstallationState({ 
      step: 'detecting', 
      progress: 10, 
      message: 'Detecting your Shopify store...' 
    });

    trackInstallationStep('page_loaded', undefined, {
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });

    // Try to auto-detect shop
    const detectedShop = detectShopDomain();
    
    if (detectedShop && detectedShop.isValid) {
      setShopInfo(detectedShop);
      trackInstallationStep('shop_detected', detectedShop.shop, { source: detectedShop.source });
      
      // Check if already installed
      const isInstalled = await checkExistingInstallation(detectedShop.shop);
      
      if (isInstalled) {
        updateInstallationState({ 
          step: 'completed', 
          progress: 100, 
          message: 'App is already installed!',
          shop: detectedShop.shop
        });
      } else {
        updateInstallationState({ 
          step: 'ready', 
          progress: 30, 
          message: `Ready to install on ${detectedShop.shop}`,
          shop: detectedShop.shop
        });
      }
    } else {
      updateInstallationState({ 
        step: 'ready', 
        progress: 20, 
        message: 'Please enter your shop domain to continue' 
      });
      setShowManualInput(true);
      trackInstallationStep('manual_input_required');
    }
  };

  const handleInstallClick = async () => {
    const targetShop = shopInfo?.shop || manualShop;
    
    // Get current URL parameters to preserve host
    const urlParams = new URLSearchParams(window.location.search);
    const currentHost = urlParams.get('host');
    const currentShop = urlParams.get('shop') || targetShop;
    
    if (!targetShop) {
      updateInstallationState({ 
        step: 'error', 
        message: 'Please enter your shop domain',
        error: 'Missing shop domain'
      });
      return;
    }

    const shopDomain = ensureShopifyDomain(targetShop);
    
    if (!validateShopDomain(shopDomain)) {
      updateInstallationState({ 
        step: 'error', 
        message: 'Please enter a valid Shopify store domain',
        error: 'Invalid shop domain'
      });
      return;
    }

    setIsInstalling(true);
    
    updateInstallationState({ 
      step: 'authorizing', 
      progress: 40, 
      message: 'Redirecting to Shopify for authorization...',
      shop: shopDomain
    });

    trackInstallationStep('oauth_started', shopDomain);
    
    // Handle OAuth initiation by directly redirecting to Shopify OAuth
    setTimeout(() => {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID || 'test-client-id-12345';
      
      if (!clientId) {
        updateInstallationState({
          step: 'error',
          message: 'Shopify Client ID not configured',
          error: 'Missing VITE_SHOPIFY_CLIENT_ID'
        });
        return;
      }
      
      // Generate state for CSRF protection
      const state = btoa(JSON.stringify({
        shop: shopDomain,
        host: currentHost || '',
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7)
      })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      // Store state for callback validation
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_shop', shopDomain);
      if (currentHost) {
        sessionStorage.setItem('oauth_host', currentHost);
      }
      
      const scopes = [
        'read_orders',
        'write_orders', 
        'read_customers',
        'read_products',
        'write_draft_orders',
        'read_inventory',
        'read_locations'
      ].join(',');
      
      const redirectUri = `${appUrl}/auth/callback`;
      const oauthUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
      oauthUrl.searchParams.set('client_id', clientId);
      oauthUrl.searchParams.set('scope', scopes);
      oauthUrl.searchParams.set('redirect_uri', redirectUri);
      oauthUrl.searchParams.set('state', state);
      
      console.log('🔄 Starting OAuth with direct Shopify redirect:', oauthUrl.toString());
      
      if (isEmbedded) {
        // For embedded apps, break out of iframe
        if (window.top && window.top !== window.self) {
          window.top.location.href = oauthUrl.toString();
        } else {
          window.location.href = oauthUrl.toString();
        }
      } else {
        // For standalone apps, redirect directly
        window.location.href = oauthUrl.toString();
      }
    }, 500);
  };

  const handleManualSubmit = () => {
    if (!manualShop) return;
    
    const shopDomain = ensureShopifyDomain(manualShop);
    const isValid = validateShopDomain(shopDomain);
    
    setShopInfo({
      shop: shopDomain,
      domain: shopDomain,
      isValid,
      source: 'manual'
    });

    if (isValid) {
      setShowManualInput(false);
      updateInstallationState({ 
        step: 'ready', 
        progress: 30, 
        message: `Ready to install on ${shopDomain}`,
        shop: shopDomain
      });
      trackInstallationStep('manual_shop_entered', shopDomain);
    }
  };

  const getProgressColor = () => {
    switch (installationState.step) {
      case 'error': return '#ef4444';
      case 'completed': return '#10b981';
      case 'authorizing': case 'processing': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getStepIcon = () => {
    switch (installationState.step) {
      case 'detecting': return '🔍';
      case 'ready': return '🚀';
      case 'authorizing': return '🔐';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '500px',
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
          color: 'white',
          padding: '30px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📦</div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>
            Returns Automation
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
            AI-powered returns management for your Shopify store
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: '0 30px', marginTop: '-10px' }}>
          <div style={{
            backgroundColor: '#f1f5f9',
            borderRadius: '10px',
            height: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: getProgressColor(),
              height: '100%',
              width: `${installationState.progress}%`,
              transition: 'width 0.5s ease-in-out',
              borderRadius: '10px'
            }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
          {/* Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '25px',
            padding: '15px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: `2px solid ${getProgressColor()}20`
          }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>
              {getStepIcon()}
            </span>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                {installationState.step.charAt(0).toUpperCase() + installationState.step.slice(1)}
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                {installationState.message}
              </div>
            </div>
          </div>

          {/* Shop Info Display */}
          {shopInfo && !showManualInput && (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>🏪</span>
                <strong style={{ color: '#065f46' }}>Store Detected</strong>
              </div>
              <div style={{ color: '#047857', fontSize: '16px', fontFamily: 'monospace' }}>
                {shopInfo.shop}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                Source: {shopInfo.source === 'url' ? 'URL parameter' : 
                         shopInfo.source === 'referrer' ? 'Shopify admin' : 
                         shopInfo.source === 'detected' ? 'Previously saved' : 'Manual entry'}
              </div>
            </div>
          )}

          {/* Manual Input */}
          {showManualInput && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151'
              }}>
                🏪 Your Shopify Store Domain
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={manualShop}
                  onChange={(e) => setManualShop(e.target.value)}
                  placeholder="your-store-name"
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualShop}
                  style={{
                    backgroundColor: manualShop ? '#3b82f6' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: manualShop ? 'pointer' : 'not-allowed',
                    fontWeight: '600'
                  }}
                >
                  ✓
                </button>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '6px'
              }}>
                Enter your store name (without .myshopify.com)
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {installationState.step === 'ready' && (
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              style={{
                width: '100%',
                backgroundColor: isInstalling ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isInstalling ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isInstalling ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Installing...
                </>
              ) : (
                <>
                  Install Returns Automation
                </>
              )}
            </button>
          )}

          {installationState.step === 'completed' && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f0fdf4',
              borderRadius: '10px',
              border: '1px solid #10b981'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
              <h3 style={{ color: '#065f46', marginBottom: '8px' }}>Installation Complete!</h3>
              <p style={{ color: '#047857', margin: 0 }}>
                You can now access Returns Automation from your Shopify admin.
              </p>
            </div>
          )}

          {installationState.step === 'error' && (
            <div style={{
              padding: '15px',
              backgroundColor: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              marginBottom: '15px'
            }}>
              <div style={{ color: '#dc2626', fontWeight: '600', marginBottom: '4px' }}>
                Installation Error
              </div>
              <div style={{ color: '#7f1d1d', fontSize: '14px' }}>
                {installationState.error || installationState.message}
              </div>
            </div>
          )}

          {/* Not manual input? Show option to enter manually */}
          {!showManualInput && !shopInfo && (
            <button
              onClick={() => setShowManualInput(true)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '2px dashed #d1d5db',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Can't detect your store? Enter manually
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '20px 30px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ color: '#6b7280', fontSize: '12px' }}>
            🔒 Secure installation • 30-day free trial • Cancel anytime
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ShopifyInstallEnhanced;