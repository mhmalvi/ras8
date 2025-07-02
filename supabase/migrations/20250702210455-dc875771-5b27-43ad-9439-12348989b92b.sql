
-- Add missing foreign key constraints to ensure data integrity
-- This will help maintain referential integrity across all tables

-- Add foreign key from returns to merchants (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'returns_merchant_id_fkey'
    ) THEN
        ALTER TABLE public.returns 
        ADD CONSTRAINT returns_merchant_id_fkey 
        FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from return_items to returns (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'return_items_return_id_fkey'
    ) THEN
        ALTER TABLE public.return_items 
        ADD CONSTRAINT return_items_return_id_fkey 
        FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from ai_suggestions to returns (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_suggestions_return_id_fkey'
    ) THEN
        ALTER TABLE public.ai_suggestions 
        ADD CONSTRAINT ai_suggestions_return_id_fkey 
        FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from analytics_events to merchants (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'analytics_events_merchant_id_fkey'
    ) THEN
        ALTER TABLE public.analytics_events 
        ADD CONSTRAINT analytics_events_merchant_id_fkey 
        FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from billing_records to merchants (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'billing_records_merchant_id_fkey'
    ) THEN
        ALTER TABLE public.billing_records 
        ADD CONSTRAINT billing_records_merchant_id_fkey 
        FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from profiles to merchants (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_merchant_id_fkey'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_merchant_id_fkey 
        FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key from users to merchants (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_merchant_id_fkey'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_merchant_id_fkey 
        FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from order_items to orders (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_order_id_fkey'
    ) THEN
        ALTER TABLE public.order_items 
        ADD CONSTRAINT order_items_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure all indexes are properly created for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_returns_merchant_id ON public.returns(merchant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_returns_status ON public.returns(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_returns_created_at ON public.returns(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_return_items_return_id ON public.return_items(return_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_suggestions_return_id ON public.ai_suggestions(return_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_merchant_id ON public.analytics_events(merchant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_merchant_id ON public.billing_records(merchant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_merchant_id ON public.profiles(merchant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_merchant_id ON public.users(merchant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_shopify_order_id ON public.orders(shopify_order_id);
