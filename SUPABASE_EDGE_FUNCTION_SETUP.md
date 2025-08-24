# 🚨 CRITICAL: Supabase Edge Function Configuration

## The Root Problem
Your Supabase Edge Functions are failing with 500 errors because they **cannot access environment variables from your local `.env` file**. Edge Functions run in Supabase's cloud infrastructure and need their own environment configuration.

---

## ✅ **1. Configure Supabase Edge Function Environment Variables**

### **Go to Supabase Dashboard:**
1. Visit: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk
2. Navigate to **Edge Functions** → **Settings** → **Environment Variables**

### **Add These Exact Variables:**

```bash
# Shopify Configuration
SHOPIFY_CLIENT_ID=2da34c83e89f6645ad1fb2028c7532dd
SHOPIFY_CLIENT_SECRET=e993e23eed15e1cef5bd22b300fd062f
SHOPIFY_WEBHOOK_SECRET=e993e23eed15e1cef5bd22b300fd062f

# Supabase Configuration  
SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YWRhamVsdmV3ZGF6d212cHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMjc2MywiZXhwIjoyMDY2ODA4NzYzfQ.xmR_VPc2ezdGE92zgNlWijvRhUiuw8hxgDpkO2nPRLc

# App Configuration
VITE_APP_URL=https://ca997aa8a2a1.ngrok-free.app
```

**IMPORTANT**: Do NOT use `VITE_` prefix for Edge Function variables. Edge Functions need the raw variable names.

---

## ✅ **2. Fix Analytics Table RLS Permissions**

### **Run the RLS Fix Script (RECOMMENDED)**

1. **Go to Supabase Dashboard SQL Editor:**
   - Visit: https://supabase.com/dashboard/project/pvadajelvewdazwmvppk/sql
   - Copy and paste the contents of `fix-analytics-rls.sql`
   - Click "Run" to execute

2. **Alternative: Quick Disable RLS (Emergency)**
   - If the policy approach doesn't work immediately
   - Use `disable-analytics-rls.sql` to completely disable RLS
   - This gives immediate access but is less secure

### **Verify the Fix**
```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'analytics_events';

-- Test insert (should work without errors)
INSERT INTO analytics_events (event_type, shop_domain, data) 
VALUES ('test_rls_fix', 'test.myshopify.com', '{"test": "rls_fixed"}');
```

---

## ✅ **3. Deploy Edge Functions**

After setting environment variables, redeploy your functions:

```bash
# In your project directory
npx supabase functions deploy shopify-oauth-callback
npx supabase functions deploy shopify-oauth-start
npx supabase functions deploy enhanced-shopify-webhook
```

---

## 🧪 **Test Edge Function Environment**

Create this test function to verify environment variables:

```bash
# Create test function
npx supabase functions new test-env

# Add this code to supabase/functions/test-env/index.ts:
```

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const envStatus = {
    SHOPIFY_CLIENT_ID: Deno.env.get('SHOPIFY_CLIENT_ID') ? 'SET' : 'MISSING',
    SHOPIFY_CLIENT_SECRET: Deno.env.get('SHOPIFY_CLIENT_SECRET') ? 'SET' : 'MISSING',
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING',
    VITE_APP_URL: Deno.env.get('VITE_APP_URL') ? 'SET' : 'MISSING',
  };

  return new Response(JSON.stringify(envStatus, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});
```

```bash
# Deploy test function
npx supabase functions deploy test-env

# Test it
curl https://pvadajelvewdazwmvppk.supabase.co/functions/v1/test-env
```

---

## 🎯 **Expected Results After Configuration**

### **Before (Current State):**
- ❌ Edge Functions: 500 Internal Server Error
- ❌ OAuth Callback: Cannot process tokens
- ❌ Analytics Events: 401 Unauthorized
- ❌ Environment Variables: Missing in functions

### **After Configuration:**
- ✅ Edge Functions: Proper environment access
- ✅ OAuth Callback: Can exchange tokens successfully  
- ✅ Analytics Events: Can insert with proper permissions
- ✅ Environment Variables: Available in function runtime

---

## 🚨 **Critical Steps Summary**

1. **Configure Supabase Edge Function environment variables** (Priority 1)
2. **Fix analytics table RLS policy** (Priority 2) 
3. **Deploy functions after environment setup** (Priority 3)
4. **Test with the test-env function** (Priority 4)

**The OAuth callback 500 errors will persist until Step 1 is completed in Supabase Dashboard.**

---

## 📋 **Checklist**

- [ ] Added environment variables in Supabase Dashboard
- [ ] Fixed analytics_events RLS policy
- [ ] Deployed functions with new environment
- [ ] Tested environment variables with test-env function
- [ ] Verified OAuth callback returns 200 instead of 500

Once these are completed, your Shopify Partner Platform integration will work correctly! 🚀