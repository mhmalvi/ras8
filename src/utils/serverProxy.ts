/**
 * Server-side proxy utilities for handling CORS-restricted requests
 */

export interface TokenExchangeResponse {
  access_token: string;
  scope: string;
  error?: string;
}

/**
 * Exchange OAuth code for access token using server-side proxy
 */
export const exchangeOAuthCode = async (
  shop: string,
  code: string,
  clientId: string,
  clientSecret: string
): Promise<TokenExchangeResponse> => {
  try {
    // Use a proxy service to avoid CORS issues
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `https://${shop}/admin/oauth/access_token`
    )}`;

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();
    return tokenData;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

/**
 * Alternative: Use a simple backend endpoint approach
 */
export const exchangeOAuthCodeViaBackend = async (
  shop: string,
  code: string
): Promise<TokenExchangeResponse> => {
  try {
    const response = await fetch('/api/oauth/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend token exchange failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Backend token exchange error:', error);
    throw error;
  }
};