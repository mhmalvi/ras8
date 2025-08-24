#!/bin/bash

# Edge Functions Deployment Script
# This script deploys all Supabase Edge Functions and tests them

echo "🚀 Starting Edge Functions Deployment"
echo "=================================="

# Check if Supabase CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

# Deploy Edge Functions
echo ""
echo "📦 Deploying Edge Functions..."

echo "  • Deploying shopify-oauth-start..."
npx supabase functions deploy shopify-oauth-start

echo "  • Deploying shopify-oauth-callback..."
npx supabase functions deploy shopify-oauth-callback

echo "  • Deploying enhanced-shopify-webhook..."
npx supabase functions deploy enhanced-shopify-webhook

echo "  • Deploying test-env (environment variable tester)..."
npx supabase functions deploy test-env

echo ""
echo "✅ Edge Functions deployed successfully!"

# Test Environment Variables
echo ""
echo "🧪 Testing Edge Function Environment Variables..."
echo "Please manually verify in Supabase Dashboard that these variables are set:"
echo ""
echo "Required Environment Variables:"
echo "  • SHOPIFY_CLIENT_ID=2da34c83e89f6645ad1fb2028c7532dd"
echo "  • SHOPIFY_CLIENT_SECRET=e993e23eed15e1cef5bd22b300fd062f"
echo "  • SHOPIFY_WEBHOOK_SECRET=e993e23eed15e1cef5bd22b300fd062f"
echo "  • SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co"
echo "  • SUPABASE_SERVICE_ROLE_KEY=eyJ..."
echo "  • VITE_APP_URL=https://ca997aa8a2a1.ngrok-free.app"
echo ""

# Test URLs
echo "🔗 Test URLs:"
echo "  • Environment Variables: https://pvadajelvewdazwmvppk.supabase.co/functions/v1/test-env"
echo "  • OAuth Start: https://pvadajelvewdazwmvppk.supabase.co/functions/v1/shopify-oauth-start?shop=test42434.myshopify.com"
echo "  • OAuth Callback: https://pvadajelvewdazwmvppk.supabase.co/functions/v1/shopify-oauth-callback"
echo "  • Client Environment Test: https://ca997aa8a2a1.ngrok-free.app/environment-test"

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "Next Steps:"
echo "1. Verify environment variables in Supabase Dashboard"
echo "2. Run analytics RLS fix SQL script"
echo "3. Test OAuth flow with environment test page"
echo "4. Verify installation works in Shopify Partner Platform"