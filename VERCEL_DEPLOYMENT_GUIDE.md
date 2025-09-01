# Vercel Deployment Guide - RAS8 Security Setup

## 🚨 CRITICAL: Environment Variables Setup

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your RAS8 project
3. Navigate to **Settings** → **Environment Variables**

### Step 2: Required Environment Variables

Copy and paste these environment variables into Vercel dashboard:

#### **🔐 Authentication & Security**
```bash
# JWT Secret - MUST be generated fresh (see below)
JWT_SECRET_KEY=GENERATE_NEW_SECRET_BELOW

# Shopify OAuth Configuration - MUST be rotated (see below)
VITE_SHOPIFY_CLIENT_ID=2da34c83e89f6645ad1fb2028c7532dd
SHOPIFY_CLIENT_SECRET=ROTATE_THIS_SECRET_IMMEDIATELY

# Application URLs
VITE_APP_URL=https://your-app-domain.vercel.app
VITE_DEV_MODE=false
```

#### **🗄️ Database Configuration**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YWRhamVsdmV3ZGF6d212cHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzI3NjMsImV4cCI6MjA2NjgwODc2M30.soX5LLfb_UxpyPuWNEYRTyQTFWjhfaNCVjIY8x_0HWA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YWRhamVsdmV3ZGF6d212cHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMjc2MywiZXhwIjoyMDY2ODA4NzYzfQ.xmR_VPc2ezdGE92zgNlWijvRhUiuw8hxgDpkO2nPRLc
SUPABASE_ACCESS_TOKEN=sbp_07b1d04900e89c31f41fe3c67b4c70b290407c6c
```

#### **🔌 External API Keys**
```bash
# OpenAI for AI recommendations
OPENAI_API_KEY=your_openai_api_key_here

# Stripe for billing
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Additional webhook secrets
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret_here
```

#### **🏗️ Build Configuration**
```bash
NODE_ENV=production
```

---

## 🔒 Security Actions Required

### 1. Generate New JWT Secret Key

**Use this command to generate a secure JWT secret:**

```bash
# Option 1: Using Node.js crypto
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online generator (use with caution)
# Visit: https://generate-secret.vercel.app/64
```

**Example output (64 characters):**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef
```

**⚠️ IMPORTANT**: 
- Never use the example above
- Generate a fresh key for your deployment
- Store securely and never commit to code

### 2. Rotate Shopify Client Secret

**Current EXPOSED secret**: `e993e23eed15e1cef5bd22b300fd062f`

**Steps to rotate:**

1. **Go to Shopify Partner Dashboard**
   - Visit: [partners.shopify.com](https://partners.shopify.com)
   - Navigate to **Apps** → **RAS8 App**

2. **Generate New Client Secret**
   - Go to **App setup** → **App credentials**
   - Click **Generate new client secret**
   - Copy the new secret immediately

3. **Update Environment Variables**
   - Add new secret to Vercel: `SHOPIFY_CLIENT_SECRET=new_secret_here`
   - Test the app functionality
   - The old secret becomes invalid automatically

4. **Update Shopify App URLs**
   - Ensure **App URL** points to: `https://your-app-domain.vercel.app`
   - Ensure **Allowed redirection URL** includes: `https://your-app-domain.vercel.app/api/auth/callback`

---

## 🚀 Deployment Process

### Step 1: Set Environment Variables
1. Add all variables from the list above to Vercel dashboard
2. Set environment for: **Production**, **Preview**, and **Development**

### Step 2: Verify Build
```bash
# Test build locally first
npm run build

# Check for any environment variable errors
npm start
```

### Step 3: Deploy
```bash
# Push to main branch triggers auto-deployment
git push origin main

# Or use Vercel CLI
npx vercel --prod
```

### Step 4: Post-Deployment Verification

**Check these URLs after deployment:**
- `https://your-app.vercel.app/` - App loads correctly
- `https://your-app.vercel.app/api/health` - Health check passes
- `https://your-app.vercel.app/install?shop=test.myshopify.com` - Install flow works

---

## 🔍 Environment Variables Checklist

| Variable | Status | Required | Notes |
|----------|---------|----------|--------|
| `JWT_SECRET_KEY` | ⚠️ GENERATE NEW | ✅ Critical | Must be 64+ chars |
| `SHOPIFY_CLIENT_SECRET` | ⚠️ ROTATE | ✅ Critical | Exposed, needs rotation |
| `VITE_SHOPIFY_CLIENT_ID` | ✅ Set | ✅ Critical | From Shopify Partner |
| `VITE_APP_URL` | ⚠️ UPDATE | ✅ Critical | Your Vercel domain |
| `VITE_SUPABASE_URL` | ✅ Set | ✅ Critical | Database connection |
| `VITE_SUPABASE_ANON_KEY` | ✅ Set | ✅ Critical | Public database key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | ✅ Critical | Admin database key |
| `OPENAI_API_KEY` | ❓ Optional | ⚠️ Feature | For AI recommendations |
| `STRIPE_SECRET_KEY` | ❓ Optional | ⚠️ Feature | For billing features |
| `NODE_ENV` | ✅ Set | ✅ Build | Must be 'production' |

---

## 🚨 Security Warnings

### ❌ DO NOT:
- Use the exposed JWT secret: `h5-production-jwt-secret-key-change-this-in-production-2024`
- Use the exposed Shopify secret: `e993e23eed15e1cef5bd22b300fd062f`
- Commit any secrets to version control
- Share environment variables in chat/email

### ✅ DO:
- Generate new JWT secret with crypto.randomBytes(64)
- Rotate Shopify client secret immediately
- Use Vercel's encrypted environment variables
- Test all functionality after deployment
- Monitor logs for authentication errors

---

## 📞 Support & Troubleshooting

### Common Issues:

1. **"JWT_SECRET_KEY is required" error**
   - Ensure JWT secret is set in Vercel environment variables
   - Verify it's available in both Production and Preview environments

2. **Shopify OAuth failures**
   - Check Shopify app URLs match your Vercel domain
   - Verify client secret is rotated and updated
   - Ensure redirect URLs are whitelisted

3. **Database connection errors**
   - Verify Supabase keys are correct and not expired
   - Check Supabase project is running

4. **Build failures**
   - Check all required environment variables are set
   - Verify TypeScript compilation passes locally

### Need Help?
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Shopify Partner Support: [partners.shopify.com/support](https://partners.shopify.com/support)
- Supabase Support: [supabase.com/support](https://supabase.com/support)

---

**Last Updated**: September 1, 2025  
**Security Level**: CRITICAL - Complete all steps before production use