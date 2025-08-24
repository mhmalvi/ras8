# 🚨 URGENT: Update Partner Platform URLs

## The Problem
You're getting `ERR_NGROK_3200` because your Shopify Partner Platform is still configured with the old ngrok URL: `9b75bb04db41.ngrok-free.app`

## The Solution  
Update your Partner Platform to use the **current active tunnel**: `https://ca997aa8a2a1.ngrok-free.app`

---

## 📋 Copy These Exact URLs to Partner Platform

### 1. **App URL** (Main app entry point)
```
https://ca997aa8a2a1.ngrok-free.app/
```

### 2. **Preferences URL** (Optional settings page)  
```
https://ca997aa8a2a1.ngrok-free.app/preferences
```

### 3. **Allowed redirection URL(s)** (OAuth callbacks)
```
https://ca997aa8a2a1.ngrok-free.app/auth/callback
https://ca997aa8a2a1.ngrok-free.app/auth/shopify/callback  
https://ca997aa8a2a1.ngrok-free.app/auth/inline
https://ca997aa8a2a1.ngrok-free.app/dashboard
https://ca997aa8a2a1.ngrok-free.app/
```

### 4. **Webhook Endpoints**
```
# Customer data request endpoint
https://ca997aa8a2a1.ngrok-free.app/functions/v1/shopify-gdpr-webhooks

# Customer data erasure endpoint
https://ca997aa8a2a1.ngrok-free.app/functions/v1/shopify-gdpr-webhooks

# Shop data erasure endpoint  
https://ca997aa8a2a1.ngrok-free.app/functions/v1/shopify-gdpr-webhooks
```

---

## 🔧 Where to Update in Partner Platform

1. **Go to**: [Shopify Partner Dashboard](https://partners.shopify.com)
2. **Navigate to**: Your App → Configuration  
3. **Update the URLs section** with the values above
4. **Save changes**

---

## ✅ Test URLs After Update

Once you've updated Partner Platform, test these URLs:

### Installation Test:
```
https://ca997aa8a2a1.ngrok-free.app/shopify/install?shop=test42434.myshopify.com
```

### OAuth Start Test:
```
https://ca997aa8a2a1.ngrok-free.app/functions/v1/shopify-oauth-start?shop=test42434.myshopify.com&host=YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvdGVzdDQyNDM0
```

### App URL Test (What Partner Platform calls):
```
https://ca997aa8a2a1.ngrok-free.app/?shop=test42434.myshopify.com&host=YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvdGVzdDQyNDM0
```

---

## 🎯 Current Status

- ✅ **Ngrok tunnel**: `https://ca997aa8a2a1.ngrok-free.app` (ACTIVE)
- ✅ **Dev server**: Running on port 8082
- ✅ **App configuration**: Updated in `shopify.app.toml`
- ❌ **Partner Platform**: Still using old URL (NEEDS UPDATE)

**Next step**: Update Partner Platform URLs above, then test!