# Shopify Client Secret Rotation Guide

## 🚨 CRITICAL: Current Secret is COMPROMISED

**Exposed Secret**: `e993e23eed15e1cef5bd22b300fd062f`  
**Status**: ❌ **COMPROMISED** - Visible in git history and audit reports  
**Action Required**: ⚠️ **IMMEDIATE ROTATION REQUIRED**

---

## 🔄 Step-by-Step Rotation Process

### Step 1: Access Shopify Partner Dashboard
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Sign in with your Shopify Partner account
3. Navigate to **Apps** from the sidebar
4. Find and click your **RAS8 Returns Automation** app

### Step 2: Locate App Credentials
1. In your app dashboard, click **App setup**
2. Scroll down to **App credentials** section
3. You'll see:
   - **Client ID**: `2da34c83e89f6645ad1fb2028c7532dd` ✅ (This stays the same)
   - **Client secret**: `e993e...` ❌ (This needs to be rotated)

### Step 3: Generate New Client Secret
1. Click **"Generate new client secret"** button
2. ⚠️ **IMPORTANT**: Copy the new secret immediately - Shopify only shows it once
3. Store it securely (you'll need it for Step 4)

**Example of what you'll see:**
```
New Client Secret: sk_live_[your_new_secret_will_appear_here]
```

### Step 4: Update Environment Variables

#### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your RAS8 project
3. Navigate to **Settings** → **Environment Variables**
4. Find `SHOPIFY_CLIENT_SECRET`
5. Click **Edit** and replace with your new secret
6. Click **Save**
7. **Important**: Update for **Production**, **Preview**, and **Development**

#### Option B: Vercel CLI
```bash
# Set production environment variable
npx vercel env add SHOPIFY_CLIENT_SECRET production

# When prompted, paste your new secret
# Example: sk_live_[your_new_secret_here]
```

### Step 5: Update App Configuration (If Needed)

1. In Shopify Partner Dashboard, go to **App setup**
2. Verify these URLs are correct:
   - **App URL**: `https://your-app-domain.vercel.app`
   - **Allowed redirection URL(s)**:
     - `https://your-app-domain.vercel.app/api/auth/callback`
     - `https://your-app-domain.vercel.app/auth/callback`

### Step 6: Test the Rotation

#### Test OAuth Flow:
1. **Trigger a new deployment** (the app needs to restart with new env vars)
   ```bash
   git commit --allow-empty -m "trigger deployment for secret rotation"
   git push origin main
   ```

2. **Test installation URL**:
   ```
   https://your-app-domain.vercel.app/install?shop=YOUR_TEST_SHOP.myshopify.com
   ```

3. **Verify OAuth callback works**:
   - App should redirect to Shopify OAuth
   - After authorization, should redirect back successfully
   - Check browser network tab for any 401/403 errors

#### Test API Endpoints:
```bash
# Health check should pass
curl https://your-app-domain.vercel.app/api/health

# OAuth endpoints should respond correctly
curl https://your-app-domain.vercel.app/api/auth/start?shop=test.myshopify.com
```

---

## 🔍 Verification Checklist

| Task | Status | Notes |
|------|--------|--------|
| Access Shopify Partner Dashboard | ⏳ | [partners.shopify.com](https://partners.shopify.com) |
| Generate new client secret | ⏳ | Copy immediately - shown only once |
| Update Vercel environment variable | ⏳ | Update in all environments |
| Verify app URLs in Shopify | ⏳ | Must match Vercel domain |
| Trigger deployment | ⏳ | App needs restart for new env vars |
| Test OAuth flow | ⏳ | Use install URL with test shop |
| Verify API endpoints | ⏳ | Check /api/health and auth endpoints |
| Monitor for errors | ⏳ | Check Vercel logs for issues |

---

## 🚨 Security Timeline

### **BEFORE Rotation:**
- ❌ Secret: `e993e23eed15e1cef5bd22b300fd062f`
- ❌ Status: **COMPROMISED** (visible in git history)
- ❌ Risk Level: **CRITICAL** - Unauthorized access possible

### **AFTER Rotation:**
- ✅ Secret: `sk_live_[new_secret]` (from Shopify Partner Dashboard)
- ✅ Status: **SECURE** (not visible in any public records)
- ✅ Risk Level: **LOW** - Only authorized personnel have access

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Invalid client secret" errors
**Cause**: Old secret still in use or cached
**Solution**: 
1. Verify new secret is in Vercel environment variables
2. Trigger a new deployment
3. Clear any cached sessions

### Issue 2: OAuth redirects fail
**Cause**: App URLs don't match Shopify configuration
**Solution**:
1. Check Shopify app setup URLs match your Vercel domain exactly
2. Ensure no trailing slashes in URLs
3. Verify HTTPS is used (not HTTP)

### Issue 3: Environment variable not updating
**Cause**: Vercel environment variables not refreshed
**Solution**:
1. Check variable is set in correct environment (Production/Preview/Development)
2. Redeploy the application
3. Check Vercel function logs for the new secret being used

### Issue 4: Multiple environment confusion
**Cause**: Different secrets in different environments
**Solution**:
1. Use the same new secret across all environments
2. Update Production, Preview, and Development simultaneously

---

## 📞 Support Resources

### Shopify Partner Support:
- Documentation: [shopify.dev/docs/apps/auth](https://shopify.dev/docs/apps/auth)
- Support Portal: [partners.shopify.com/support](https://partners.shopify.com/support)
- Community: [community.shopify.com](https://community.shopify.com)

### Vercel Support:
- Environment Variables: [vercel.com/docs/concepts/projects/environment-variables](https://vercel.com/docs/concepts/projects/environment-variables)
- Support: [vercel.com/support](https://vercel.com/support)

---

## 📝 Post-Rotation Actions

1. ✅ **Delete old references** - Remove old secret from any documentation
2. ✅ **Update team** - Inform team members of the secret rotation
3. ✅ **Monitor logs** - Watch for authentication errors for 24-48 hours
4. ✅ **Document completion** - Record rotation date and new secret ID
5. ✅ **Schedule next rotation** - Consider rotating quarterly for security

---

**⚠️ IMPORTANT REMINDERS**

- **The old secret becomes invalid** immediately after generating a new one
- **Copy the new secret immediately** - Shopify only shows it once
- **Test thoroughly** before declaring the rotation complete
- **Monitor application logs** for any authentication failures
- **Keep the new secret secure** - never commit to version control

---

**Rotation Guide Created**: September 1, 2025  
**Priority**: 🚨 **CRITICAL** - Complete within 24 hours  
**Security Impact**: **HIGH** - Prevents unauthorized access to your Shopify app