/**
 * React hook for making authenticated API calls with session tokens
 */

import { useAppBridge } from '@/components/AppBridgeProvider';
import { getSessionToken } from '@/middleware/sessionTokenMiddleware';

export const useShopifyAPI = () => {
  const { app } = useAppBridge();
  
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const sessionToken = await getSessionToken(app);
    
    if (!sessionToken) {
      throw new Error('No session token available');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });
  };

  return { makeAuthenticatedRequest };
};