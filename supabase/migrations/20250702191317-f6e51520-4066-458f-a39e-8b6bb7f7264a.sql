-- Remove duplicate foreign key constraints that are causing ambiguity

-- Drop duplicate foreign key constraint for ai_suggestions table
ALTER TABLE public.ai_suggestions DROP CONSTRAINT IF EXISTS fk_ai_suggestions_return;

-- Drop duplicate foreign key constraint for return_items table  
ALTER TABLE public.return_items DROP CONSTRAINT IF EXISTS fk_return_items_return;

-- Drop duplicate foreign key constraint for analytics_events table
ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS fk_analytics_events_merchant;

-- Drop duplicate foreign key constraint for billing_records table
ALTER TABLE public.billing_records DROP CONSTRAINT IF EXISTS fk_billing_records_merchant;

-- Drop duplicate foreign key constraint for returns table
ALTER TABLE public.returns DROP CONSTRAINT IF EXISTS fk_returns_merchant;

-- Drop duplicate foreign key constraint for users table
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_merchant;