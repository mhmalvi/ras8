# Environment Variables Setup Guide

## Quick Setup

Since your environment variables are already configured in Vercel, you need to manually copy them to your local `.env.local` file.

### Steps to Get Your Environment Variables:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/info-quadquetechs-projects/ras8/settings/environment-variables

2. **Copy each variable value and update `.env.local`**
   
   Open `.env.local` and replace the placeholder values with your actual values from Vercel:

   ```bash
   # Shopify Configuration
   VITE_SHOPIFY_CLIENT_ID=<copy from Vercel>
   SHOPIFY_CLIENT_SECRET=<copy from Vercel>

   # Supabase Configuration  
   VITE_SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co
   VITE_SUPABASE_ANON_KEY=<copy from Vercel>
   SUPABASE_SERVICE_ROLE_KEY=<copy from Vercel>
   SUPABASE_ACCESS_TOKEN=<copy from Vercel>

   # Security Configuration
   JWT_SECRET_KEY=<copy from Vercel>
   ```

3. **Verify Setup**
   ```bash
   # Check if environment variables are loaded
   npm run dev
   ```

## Alternative: Using Vercel CLI (Requires Login)

If you want to use Vercel CLI to automatically pull environment variables:

```bash
# 1. Login to Vercel
npx vercel login

# 2. Pull environment variables
npx vercel env pull .env.local

# 3. Verify the .env.local file was created with all variables
cat .env.local
```

## Important Notes

- **Never commit `.env.local`** - It's already in `.gitignore`
- **Keep credentials secure** - Don't share them in public repositories
- **Development vs Production** - Some values might differ between environments

## Deployment

Your project is already linked to Vercel. To deploy:

```bash
# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod
```

## Project Details

- **Project ID**: prj_hg8wHWCS2dXpLfxT2cImJ9k7UdY1
- **Team ID**: team_WU3jXeVAggHI8RqFopbE23M7
- **Production URL**: https://ras8.vercel.app
- **Latest Deployment**: https://ras8-9a8cibaj1-info-quadquetechs-projects.vercel.app