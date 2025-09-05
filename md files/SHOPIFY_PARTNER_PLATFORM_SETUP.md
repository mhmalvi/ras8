# Shopify Partner Platform Integration Guide

This guide provides complete setup instructions for integrating your H5 Returns Management app with Shopify Partner Platform.

## 🚀 Quick Start

1. **Start Development Environment**
   ```bash
   # Use the automated script
   start-shopify-dev.bat
   
   # Or manually:
   ngrok start shopify-app --config=ngrok.yml
   npm run dev
   ```

2. **Get Your ngrok URL**
   The script will automatically display your tunnel URL. Example: `https://ca997aa8a2a1.ngrok-free.app`

3. **Configure Shopify Partner Platform**
   Update your app settings in the Shopify Partner Dashboard with the URLs shown by the script.

## 🔧 Partner Platform Configuration

### Required URLs in Partner Dashboard

1. **App URL** (Main entry point)
   ```
   https://your-tunnel.ngrok-free.app/
   ```

2. **Preferences URL** (Optional settings page)
   ```
   https://your-tunnel.ngrok-free.app/preferences
   ```

3. **Allowed Redirection URLs** (OAuth callbacks)
   ```
   https://your-tunnel.ngrok-free.app/auth/callback
   https://your-tunnel.ngrok-free.app/auth/shopify/callback
   https://your-tunnel.ngrok-free.app/auth/inline
   https://your-tunnel.ngrok-free.app/dashboard
   https://your-tunnel.ngrok-free.app/
   ```

4. **Webhook Endpoints**
   ```
   # Main webhooks
   https://your-tunnel.ngrok-free.app/functions/v1/shopify-webhook
   
   # GDPR compliance webhooks
   https://your-tunnel.ngrok-free.app/functions/v1/shopify-gdpr-webhooks
   ```

## 🛠️ Technical Implementation

### App Bridge Integration

The app automatically detects when running in Shopify Admin and initializes App Bridge:

```typescript
// Embedded detection
const isEmbedded = urlParams.has('host') || urlParams.has('shop');

// App Bridge initialization
const appBridge = createApp({
  apiKey: clientId,
  host: validHost,
  forceRedirect: true,
  development: import.meta.env.DEV
});
```

### OAuth Flow

1. **Installation** → `/shopify/install`
2. **OAuth Start** → `/auth/start`
3. **Shopify Authorization** → External Shopify OAuth
4. **Callback** → `/auth/callback` or `/auth/shopify/callback`
5. **Dashboard** → `/dashboard`

### CSP Headers

Optimized Content Security Policy for Partner Platform:

```javascript
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://*.shopifycloud.com;
  frame-ancestors 'self' https://*.shopify.com https://admin.shopify.com https://partners.shopify.com;
  connect-src 'self' https: wss: https://*.shopify.com https://partners.shopify.com;
```

### WebSocket Support

Configured for App Bridge communication:

```javascript
// WebSocket plugin handles App Bridge connections
server.ws.on('connection', (socket) => {
  // Handle App Bridge ping/pong
  socket.on('message', (data) => {
    const message = JSON.parse(data);
    if (message.type === 'APP_BRIDGE_PING') {
      socket.send(JSON.stringify({ type: 'APP_BRIDGE_PONG' }));
    }
  });
});
```

## 🧪 Testing

### Partner Platform Test Page

Visit `/partner-platform-test` to run comprehensive tests:

- ✅ URL Parameters validation
- ✅ Embedding detection
- ✅ App Bridge initialization
- ✅ WebSocket connectivity
- ✅ CSP headers verification
- ✅ Frame ancestors check

### Manual Testing

1. **Installation Flow**
   ```
   https://your-tunnel.ngrok-free.app/shopify/install?shop=your-dev-store.myshopify.com
   ```

2. **Embedded Access**
   ```
   https://admin.shopify.com/store/your-dev-store/apps/your-app
   ```

3. **Preferences**
   ```
   https://your-tunnel.ngrok-free.app/preferences?shop=your-dev-store.myshopify.com
   ```

## 🔍 Debugging

### Common Issues

1. **ERR_NGROK_3200**: Tunnel offline
   - Restart ngrok: `ngrok start shopify-app --config=ngrok.yml`
   - Update Partner Platform URLs with new tunnel URL

2. **CSP Violations**: Scripts blocked
   - Check console for CSP errors
   - Verify CSP headers include Shopify domains

3. **App Bridge Errors**: Connection failures
   - Ensure `host` parameter is present
   - Check WebSocket connection in Network tab

4. **OAuth Failures**: Redirect errors
   - Verify all redirect URLs are configured in Partner Platform
   - Check that callback routes are properly implemented

### Debug Routes

- `/debug-auth` - OAuth debugging
- `/embed-test` - Embedding tests
- `/partner-platform-test` - Comprehensive platform testing
- `/diagnostic` - General diagnostics

## 📁 File Structure

```
src/
├── pages/
│   ├── ShopifyAuthCallback.tsx    # OAuth callback handler
│   ├── PreferencesPage.tsx        # Partner Platform preferences
│   ├── PartnerPlatformTest.tsx    # Testing interface
│   └── ...
├── components/
│   ├── AppBridgeProvider.tsx      # App Bridge integration
│   ├── AtomicAppRouter.tsx        # Route configuration
│   └── ...
├── utils/
│   ├── shopifyInstallation.ts     # OAuth utilities
│   └── ...
└── ...

# Configuration files
├── ngrok.yml                      # ngrok tunnel config
├── vite-csp-plugin.js            # CSP headers
├── vite-websocket-plugin.js      # WebSocket support
├── shopify.app.toml              # Shopify app config
└── start-shopify-dev.bat         # Development startup script
```

## 🔐 Security

### Best Practices

1. **CSP Headers**: Restrict resource loading to trusted domains
2. **Frame Ancestors**: Allow only Shopify domains in iframes
3. **HTTPS Only**: All Partner Platform URLs must use HTTPS
4. **OAuth Validation**: Verify state parameters and shop domains
5. **Session Security**: Implement proper session management

### Environment Variables

```bash
VITE_SHOPIFY_CLIENT_ID=your_client_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## 🚨 Production Considerations

1. **Custom Domain**: Replace ngrok with a stable domain
2. **SSL Certificate**: Ensure valid HTTPS certificate
3. **Rate Limiting**: Implement API rate limiting
4. **Error Monitoring**: Set up comprehensive error tracking
5. **Health Checks**: Monitor app availability

## 📞 Support

- Check `/partner-platform-test` for diagnostic information
- Review browser console for App Bridge errors
- Verify Partner Platform configuration matches your tunnel URL
- Test OAuth flow in incognito/private browsing mode

---

**Note**: This setup is optimized for development with ngrok. For production, replace ngrok with a stable domain and update all configurations accordingly.