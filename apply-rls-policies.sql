-- Production RLS Policies Application Script
-- ⚠️  IMPORTANT: Apply this carefully in your Supabase SQL Editor
-- Test thoroughly in development before production!

-- Step 1: Enable RLS on core tables
-- Run these one by one and verify no errors

DO $$
BEGIN
  -- Enable RLS with error handling
  BEGIN
    ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on merchants table';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️  Error enabling RLS on merchants: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on returns table';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️  Error enabling RLS on returns: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on analytics_events table';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️  Error enabling RLS on analytics_events: %', SQLERRM;
  END;
END $$;

-- Step 2: Create helper function first
CREATE OR REPLACE FUNCTION get_current_merchant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  merchant_id UUID;
BEGIN
  -- For service role, allow access
  IF auth.role() = 'service_role' THEN
    RETURN NULL; -- Service role bypasses merchant-specific filtering
  END IF;
  
  -- Get merchant ID from shop domain in JWT
  SELECT id INTO merchant_id 
  FROM merchants 
  WHERE shop_domain = auth.jwt() ->> 'shop';
  
  RETURN merchant_id;
END;
$$;

-- Step 3: Create merchants table policies
CREATE POLICY "merchants_select_own" ON merchants
  FOR SELECT USING (
    auth.jwt() ->> 'shop' = shop_domain OR
    auth.role() = 'service_role'
  );

CREATE POLICY "merchants_update_own" ON merchants  
  FOR UPDATE USING (
    auth.jwt() ->> 'shop' = shop_domain OR
    auth.role() = 'service_role'
  );

CREATE POLICY "merchants_insert_service" ON merchants
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Step 4: Create returns table policies
CREATE POLICY "returns_select_own" ON returns
  FOR SELECT USING (
    merchant_id IN (
      SELECT id FROM merchants 
      WHERE shop_domain = auth.jwt() ->> 'shop'
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "returns_insert_own" ON returns
  FOR INSERT WITH CHECK (
    merchant_id IN (
      SELECT id FROM merchants 
      WHERE shop_domain = auth.jwt() ->> 'shop'
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "returns_update_own" ON returns
  FOR UPDATE USING (
    merchant_id IN (
      SELECT id FROM merchants 
      WHERE shop_domain = auth.jwt() ->> 'shop'
    ) OR auth.role() = 'service_role'
  );

-- Step 5: Create analytics_events table policies
CREATE POLICY "analytics_select_own" ON analytics_events
  FOR SELECT USING (
    merchant_id IN (
      SELECT id FROM merchants 
      WHERE shop_domain = auth.jwt() ->> 'shop'
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "analytics_insert_service" ON analytics_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Step 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_returns_merchant_id ON returns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_merchant_id ON analytics_events(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchants_shop_domain ON merchants(shop_domain);

-- Step 7: Create audit function (optional - for advanced monitoring)
CREATE OR REPLACE FUNCTION audit_merchant_operations()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log if analytics_events table is accessible
  BEGIN
    INSERT INTO analytics_events (
      merchant_id,
      event_type,
      event_data,
      created_at
    ) VALUES (
      COALESCE(NEW.merchant_id, OLD.merchant_id),
      TG_OP || '_' || TG_TABLE_NAME,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'user_role', auth.role(),
        'jwt_shop', auth.jwt() ->> 'shop',
        'timestamp', NOW()
      ),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Silently continue if audit logging fails
      NULL;
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers (optional)
DROP TRIGGER IF EXISTS audit_returns_operations ON returns;
CREATE TRIGGER audit_returns_operations
  AFTER INSERT OR UPDATE OR DELETE ON returns
  FOR EACH ROW EXECUTE FUNCTION audit_merchant_operations();

DROP TRIGGER IF EXISTS audit_merchants_operations ON merchants;
CREATE TRIGGER audit_merchants_operations
  AFTER UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION audit_merchant_operations();

-- Final verification queries
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count policies to verify they were created
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN ('merchants', 'returns', 'analytics_events');
  
  RAISE NOTICE '✅ Created % RLS policies across core tables', policy_count;
  
  -- Verify RLS is enabled
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE n.nspname = 'public' 
      AND c.relname = 'merchants' 
      AND c.relrowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS is enabled on merchants table';
  ELSE
    RAISE NOTICE '❌ RLS is NOT enabled on merchants table';
  END IF;
END $$;