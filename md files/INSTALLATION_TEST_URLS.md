# Shopify Partner Platform Installation Test URLs

Use these URLs to test your Partner Platform integration properly:

## 🧪 Test URLs for Partner Platform Validation

### 1. **Direct App Installation** (Simulates Partner Platform Install)
```
https://ca997aa8a2a1.ngrok-free.app/shopify/install?shop=your-dev-store.myshopify.com
```

### 2. **App URL Test** (What Partner Platform calls)
```
https://ca997aa8a2a1.ngrok-free.app/?shop=your-dev-store.myshopify.com&host=eW91ci1kZXYtc3RvcmUubXlzaG9waWZ5LmNvbS9hZG1pbg
```

### 3. **Preferences URL Test**
```
https://ca997aa8a2a1.ngrok-free.app/preferences?shop=your-dev-store.myshopify.com&host=eW91ci1kZXYtc3RvcmUubXlzaG9waWZ5LmNvbS9hZG1pbg
```

### 4. **OAuth Callback Test**
```
https://ca997aa8a2a1.ngrok-free.app/auth/callback?shop=your-dev-store.myshopify.com&code=test123&state=test-state
```

### 5. **Embedded Context Test**
```
https://ca997aa8a2a1.ngrok-free.app/partner-platform-test?shop=test-store.myshopify.com&host=dGVzdC1zdG9yZS5teXNob3BpZnkuY29tL2FkbWlu
```

## 📋 Partner Platform Configuration Checklist

### In Shopify Partner Dashboard, set these URLs:

1. **App URL**:
   ```
   https://ca997aa8a2a1.ngrok-free.app/
   ```

2. **Preferences URL** (optional):
   ```
   https://ca997aa8a2a1.ngrok-free.app/preferences
   ```

3. **Allowed redirection URLs**:
   ```
   https://ca997aa8a2a1.ngrok-free.app/auth/callback
   https://ca997aa8a2a1.ngrok-free.app/auth/shopify/callback
   https://ca997aa8a2a1.ngrok-free.app/auth/inline
   https://ca997aa8a2a1.ngrok-free.app/dashboard
   https://ca997aa8a2a1.ngrok-free.app/
   ```

4. **Webhook endpoints**:
   ```
   # Customer data request endpoint
   https://ca997aa8a2a1.ngrok-free.app/functions/v1/shopify-gdpr-webhooks
   
   # Customer data erasure endpoint  
   https://ca997aa8a2a1.ngrok-free.app/functions/v1/shopify-gdpr-webhooks
   
   # Shop data erasure endpoint
   https://ca997aa8a2a1.ngrok-free.app/functions/v1/shopify-gdpr-webhooks
   ```

## ✅ Testing Flow

1. **Start your development environment**:
   ```bash
   start-shopify-dev.bat
   ```

2. **Update Partner Platform URLs** with the ngrok URL shown in the console

3. **Test installation** using the App URL in an incognito window

4. **Test embedded context** by accessing the app through Shopify Admin

5. **Run diagnostics** at `/partner-platform-test`

## 🔍 Expected Test Results

### Standalone Mode (Direct Access):
- ❌ URL Parameters: FAIL (expected - no shop/host params)
- ❌ Embedding Detection: FAIL (expected - not embedded)  
- ❌ App Bridge: FAIL (expected - no embedding context)
- ✅ CSP Headers: PASS
- ❌ Frame Ancestors: FAIL (expected - not in iframe)

### Embedded Mode (With shop/host params):
- ✅ URL Parameters: PASS
- ✅ Embedding Detection: PASS
- ✅ App Bridge: PASS
- ✅ CSP Headers: PASS  
- ✅ Frame Ancestors: PASS (if accessed via iframe)

## 🚨 Troubleshooting

### If tests are failing:

1. **Check ngrok tunnel**: Ensure `https://ca997aa8a2a1.ngrok-free.app` is accessible
2. **Verify Partner Platform URLs**: Must match exactly in dashboard
3. **Test with shop parameter**: Add `?shop=your-dev-store.myshopify.com`
4. **Check browser console**: Look for CSP or App Bridge errors
5. **Use incognito mode**: Avoid cookie/cache issues

### Common Issues:

- **WebSocket fails**: Normal in ngrok free tier, won't affect functionality
- **App Bridge fails without shop param**: Expected behavior
- **CSP violations**: Check browser console for blocked resources
- **OAuth redirect errors**: Verify all callback URLs in Partner Platform

---

**Next Step**: Copy the current ngrok URL and update your Shopify Partner Platform app configuration, then test using the URLs above.