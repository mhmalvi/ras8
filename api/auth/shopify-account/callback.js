export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing OAuth parameters' });
    }

    // For now, return mock user data
    // In production, this would:
    // 1. Exchange the code for an access token with Shopify's accounts API
    // 2. Use the access token to get user info and store list
    // 3. Return the actual user data
    
    const mockUserData = {
      user: {
        id: 'user_123',
        name: 'John Merchant',
        email: 'john@example.com',
        avatar: null
      },
      stores: [
        {
          id: 'store_1',
          name: 'Main Store',
          domain: 'main-store.myshopify.com',
          url: 'https://main-store.myshopify.com',
          plan: 'Shopify Plus',
          connected: false
        },
        {
          id: 'store_2',
          name: 'Secondary Store', 
          domain: 'secondary-store.myshopify.com',
          url: 'https://secondary-store.myshopify.com',
          plan: 'Advanced',
          connected: false
        }
      ]
    };

    return res.status(200).json(mockUserData);

  } catch (error) {
    console.error('Shopify account callback error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}