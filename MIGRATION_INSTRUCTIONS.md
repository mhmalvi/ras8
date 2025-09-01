# 🚀 Database Migration Instructions

The landing logic system requires database changes to function properly. The error you're seeing indicates that the `validate_merchant_integration` function doesn't exist in the production database.

## ⚠️ Current Status

The application is deployed but showing errors because the database migration hasn't been applied:

```
Could not find the function public.validate_merchant_integration(p_user_id) in the schema cache
```

## 📋 Required Actions

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `pvadajelvewdazwmvppk`
3. Navigate to **SQL Editor** from the left sidebar

### Step 2: Apply Migration

1. Copy the entire contents of `supabase/migrations/20250102000000_landing_logic_database_schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the migration

The migration will:
- ✅ Create `shopify_tokens` table with proper merchant separation
- ✅ Add missing columns to `merchants` table (`status`, `shop_id`, etc.)
- ✅ Create helper functions (`validate_merchant_integration`, `get_merchant_with_token`, etc.)
- ✅ Set up proper constraints and indexes
- ✅ Enable Row Level Security policies

### Step 3: Verify Migration Success

After running the migration, you should see these new database objects:

**New Tables:**
- `shopify_tokens` - Stores encrypted Shopify access tokens

**New Functions:**
- `validate_merchant_integration(p_user_id)` - Core landing logic function
- `get_merchant_with_token(p_merchant_id)` - Token retrieval helper
- `mark_merchant_uninstalled(p_shop_domain)` - Webhook handler helper

**Updated Tables:**
- `merchants` - Now has `status`, `shop_id`, `installed_at`, `uninstalled_at` columns

## 🧪 Testing After Migration

Once the migration is applied, the application should:

1. ✅ Stop showing the `validate_merchant_integration` error
2. ✅ Properly route users based on their integration status
3. ✅ Show appropriate landing pages:
   - New users → `/connect-shopify`
   - Integrated users → `/dashboard`
   - Master admins → `/master-admin`
   - Reconnection needed → `/reconnect`

## 🔍 Troubleshooting

If you encounter issues:

1. **Check the SQL Editor for errors** - The migration includes error handling
2. **Verify all functions were created** - Check in Database > Functions
3. **Confirm tables exist** - Check in Database > Tables
4. **Review RLS policies** - Ensure they don't block legitimate access

## 📞 Support

If you need assistance with the migration:
1. Check the SQL Editor output for specific error messages
2. Ensure you have sufficient database permissions
3. The migration is designed to be safe and idempotent (can run multiple times)

## 🎯 Expected Result

After successful migration, the landing logic will work as designed:
- Authenticated users will be properly routed based on their merchant integration status
- The application logs will show successful landing decisions
- No more database function errors