-- ================================================================
-- CRITICAL SECURITY PATCHES - TENANT ISOLATION FIX
-- ================================================================
--
-- These patches fix the critical tenant isolation vulnerabilities
-- identified in the security audit. 
--
-- ⚠️  IMPORTANT: Test in development first, then deploy to production
-- 
-- Apply these patches in order. Some may require application restarts.
--
-- ================================================================

-- ================================================================
-- PATCH 1: EMERGENCY - Remove Dangerous Public Policies
-- ================================================================

-- These policies completely bypass tenant isolation - REMOVE IMMEDIATELY
BEGIN;

DO $$ 
BEGIN
    -- Remove dangerous "Public access for demo" policies
    DROP POLICY IF EXISTS "Public access for demo" ON public.merchants;
    DROP POLICY IF EXISTS "Public access for demo" ON public.returns;
    DROP POLICY IF EXISTS "Public access for demo" ON public.return_items;
    DROP POLICY IF EXISTS "Public access for demo" ON public.ai_suggestions;
    DROP POLICY IF EXISTS "Public access for demo" ON public.analytics_events;
    DROP POLICY IF EXISTS "Public access for demo" ON public.billing_records;
    DROP POLICY IF EXISTS "Public access for demo" ON public.users;
    DROP POLICY IF EXISTS "Public access for demo" ON public.profiles;
    
    -- Remove other dangerous public policies
    DROP POLICY IF EXISTS "Public read access for orders" ON orders;
    DROP POLICY IF EXISTS "Public read access for order_items" ON order_items;
    DROP POLICY IF EXISTS "Customers can view orders by email" ON orders;
    DROP POLICY IF EXISTS "Customers can view their returns" ON returns;
    
    RAISE NOTICE 'Dangerous public policies removed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Warning: Some policies may not exist - %', SQLERRM;
END $$;

COMMIT;

-- ================================================================
-- PATCH 2: Create Secure Helper Functions
-- ================================================================

-- Function to get current user's merchant ID from JWT/session
CREATE OR REPLACE FUNCTION get_current_user_merchant_id()
RETURNS UUID AS $$
DECLARE
    user_merchant_id UUID;
BEGIN
    -- Get merchant_id from the user's profile
    SELECT merchant_id INTO user_merchant_id
    FROM profiles 
    WHERE id = auth.uid();
    
    -- If no profile found, return NULL (will cause RLS to deny access)
    RETURN user_merchant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's email (for customer portal)
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email')::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a system admin
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- PATCH 3: Implement Secure RLS Policies for Core Tables
-- ================================================================

-- Merchants table - users can only access their own merchant
DROP POLICY IF EXISTS "Secure merchant access" ON public.merchants;
CREATE POLICY "Secure merchant access" ON public.merchants
FOR ALL USING (
    id = get_current_user_merchant_id() OR is_system_admin()
)
WITH CHECK (
    id = get_current_user_merchant_id() OR is_system_admin()
);

-- Profiles table - users can only access their own profile
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;
CREATE POLICY "Secure profile access" ON public.profiles
FOR ALL USING (
    id = auth.uid() OR 
    (merchant_id = get_current_user_merchant_id() AND is_system_admin())
)
WITH CHECK (
    id = auth.uid() OR 
    (merchant_id = get_current_user_merchant_id() AND is_system_admin())
);

-- Returns table - merchant-scoped access
DROP POLICY IF EXISTS "Secure returns access" ON public.returns;
CREATE POLICY "Secure returns access" ON public.returns
FOR ALL USING (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
)
WITH CHECK (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
);

-- Return items table - access through returns
DROP POLICY IF EXISTS "Secure return items access" ON public.return_items;
CREATE POLICY "Secure return items access" ON public.return_items
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM returns r 
        WHERE r.id = return_items.return_id 
        AND (r.merchant_id = get_current_user_merchant_id() OR is_system_admin())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM returns r 
        WHERE r.id = return_items.return_id 
        AND (r.merchant_id = get_current_user_merchant_id() OR is_system_admin())
    )
);

-- Analytics events table - merchant-scoped
DROP POLICY IF EXISTS "Secure analytics access" ON public.analytics_events;
CREATE POLICY "Secure analytics access" ON public.analytics_events
FOR ALL USING (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
)
WITH CHECK (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
);

-- Billing records table - merchant-scoped
DROP POLICY IF EXISTS "Secure billing access" ON public.billing_records;
CREATE POLICY "Secure billing access" ON public.billing_records
FOR ALL USING (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
)
WITH CHECK (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
);

-- AI suggestions table - access through returns
DROP POLICY IF EXISTS "Secure ai suggestions access" ON public.ai_suggestions;
CREATE POLICY "Secure ai suggestions access" ON public.ai_suggestions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM returns r 
        WHERE r.id = ai_suggestions.return_id 
        AND (r.merchant_id = get_current_user_merchant_id() OR is_system_admin())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM returns r 
        WHERE r.id = ai_suggestions.return_id 
        AND (r.merchant_id = get_current_user_merchant_id() OR is_system_admin())
    )
);

-- ================================================================
-- PATCH 4: Fix Orders Table Security
-- ================================================================

-- First check if orders table has merchant_id column
DO $$
BEGIN
    -- Add merchant_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'merchant_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN merchant_id UUID REFERENCES merchants(id);
        RAISE NOTICE 'Added merchant_id column to orders table';
    END IF;
    
    -- Add foreign key constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_merchant_id_fkey'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_merchant_id_fkey 
        FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for orders.merchant_id';
    END IF;
END $$;

-- Secure orders table policies
DROP POLICY IF EXISTS "Secure orders access" ON public.orders;
CREATE POLICY "Secure orders access" ON public.orders
FOR ALL USING (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
)
WITH CHECK (
    merchant_id = get_current_user_merchant_id() OR is_system_admin()
);

-- ================================================================
-- PATCH 5: Fix Order Items Table Security  
-- ================================================================

-- Order items inherit merchant context through orders
DROP POLICY IF EXISTS "Secure order items access" ON public.order_items;
CREATE POLICY "Secure order items access" ON public.order_items
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM orders o 
        WHERE o.id = order_items.order_id 
        AND (o.merchant_id = get_current_user_merchant_id() OR is_system_admin())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders o 
        WHERE o.id = order_items.order_id 
        AND (o.merchant_id = get_current_user_merchant_id() OR is_system_admin())
    )
);

-- ================================================================
-- PATCH 6: Add Missing Tables and Policies (If They Exist)
-- ================================================================

-- Products table security (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        -- Add merchant_id if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'merchant_id'
        ) THEN
            ALTER TABLE products ADD COLUMN merchant_id UUID REFERENCES merchants(id);
        END IF;
        
        -- Create secure policy
        DROP POLICY IF EXISTS "Secure products access" ON public.products;
        CREATE POLICY "Secure products access" ON public.products
        FOR ALL USING (
            merchant_id = get_current_user_merchant_id() OR is_system_admin()
        )
        WITH CHECK (
            merchant_id = get_current_user_merchant_id() OR is_system_admin()
        );
        
        RAISE NOTICE 'Secured products table';
    END IF;
END $$;

-- Customers table security (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        -- Add merchant_id if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name = 'merchant_id'
        ) THEN
            ALTER TABLE customers ADD COLUMN merchant_id UUID REFERENCES merchants(id);
        END IF;
        
        -- Create secure policy
        DROP POLICY IF EXISTS "Secure customers access" ON public.customers;
        CREATE POLICY "Secure customers access" ON public.customers
        FOR ALL USING (
            merchant_id = get_current_user_merchant_id() OR is_system_admin()
        )
        WITH CHECK (
            merchant_id = get_current_user_merchant_id() OR is_system_admin()
        );
        
        RAISE NOTICE 'Secured customers table';
    END IF;
END $$;

-- ================================================================
-- PATCH 7: Customer Portal Secure Policies
-- ================================================================

-- Allow customers to view their own orders (with merchant context)
DROP POLICY IF EXISTS "Customer order access" ON public.orders;
CREATE POLICY "Customer order access" ON public.orders
FOR SELECT USING (
    customer_email = get_current_user_email() OR
    merchant_id = get_current_user_merchant_id() OR 
    is_system_admin()
);

-- Allow customers to view their own returns (with merchant context)
DROP POLICY IF EXISTS "Customer returns access" ON public.returns;
CREATE POLICY "Customer returns access" ON public.returns
FOR SELECT USING (
    customer_email = get_current_user_email() OR
    merchant_id = get_current_user_merchant_id() OR 
    is_system_admin()
);

-- Allow customers to create returns for their orders
DROP POLICY IF EXISTS "Customer returns creation" ON public.returns;
CREATE POLICY "Customer returns creation" ON public.returns
FOR INSERT WITH CHECK (
    customer_email = get_current_user_email() AND
    EXISTS (
        SELECT 1 FROM orders o 
        WHERE o.shopify_order_id = returns.shopify_order_id 
        AND o.customer_email = get_current_user_email()
    )
);

-- ================================================================
-- PATCH 8: Enable RLS on All Tables
-- ================================================================

-- Ensure RLS is enabled on all critical tables
DO $$
DECLARE
    tbl_name TEXT;
    tables_to_secure TEXT[] := ARRAY[
        'merchants', 'profiles', 'orders', 'order_items', 
        'returns', 'return_items', 'analytics_events', 
        'billing_records', 'ai_suggestions', 'products', 'customers'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY tables_to_secure
    LOOP
        -- Check if table exists before enabling RLS
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
            RAISE NOTICE 'Enabled RLS for table: %', tbl_name;
        END IF;
    END LOOP;
END $$;

-- ================================================================
-- PATCH 9: Data Integrity Fixes
-- ================================================================

-- Update existing orders without merchant_id (if any)
-- This assumes you can determine merchant from shop_domain or similar
DO $$
BEGIN
    -- Only update if orders table has merchant_id column and there are NULL values
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'merchant_id'
    ) THEN
        -- Update orders that don't have merchant_id set
        -- You'll need to customize this logic based on your data structure
        UPDATE orders 
        SET merchant_id = (
            SELECT m.id 
            FROM merchants m 
            WHERE m.shop_domain = orders.shop_domain  -- Adjust this logic
        )
        WHERE merchant_id IS NULL 
        AND shop_domain IS NOT NULL;
        
        RAISE NOTICE 'Updated orders with missing merchant_id';
    END IF;
END $$;

-- ================================================================
-- PATCH 10: Create Audit Logging
-- ================================================================

-- Create table for security audit events
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    merchant_id UUID REFERENCES merchants(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only system admins can read audit logs
CREATE POLICY "Admin audit log access" ON security_audit_log
FOR ALL USING (is_system_admin())
WITH CHECK (is_system_admin());

-- ================================================================
-- PATCH 11: Create Security Monitoring Functions
-- ================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    action_type TEXT,
    resource_type TEXT,
    resource_id TEXT DEFAULT NULL,
    event_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_audit_log (
        user_id,
        merchant_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        auth.uid(),
        get_current_user_merchant_id(),
        action_type,
        resource_type,
        resource_id,
        event_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Verify that dangerous policies are removed
SELECT 'VERIFICATION: Checking for dangerous policies' as check_type;
SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    CASE 
        WHEN qual = 'true' THEN '🚨 STILL DANGEROUS'
        ELSE '✅ SECURE'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND qual = 'true';

-- Verify RLS is enabled
SELECT 'VERIFICATION: Checking RLS status' as check_type;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '🚨 RLS DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'merchants', 'profiles', 'orders', 'returns', 
    'analytics_events', 'billing_records'
)
ORDER BY tablename;

-- Check for orphaned data
SELECT 'VERIFICATION: Checking for orphaned data' as check_type;
SELECT 
    'orders' as table_name,
    COUNT(*) as orphaned_count
FROM orders 
WHERE merchant_id IS NULL
UNION ALL
SELECT 
    'returns' as table_name,
    COUNT(*) as orphaned_count
FROM returns 
WHERE merchant_id IS NULL;

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

SELECT 'SECURITY PATCHES APPLIED SUCCESSFULLY' as status;
SELECT 'Review verification results above' as next_step;
SELECT 'Test application functionality after applying patches' as important_note;
SELECT 'Monitor security_audit_log for any access violations' as monitoring;