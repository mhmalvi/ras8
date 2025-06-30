
-- Add Row Level Security policies for merchants table
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- Create policy for merchants to access their own data
CREATE POLICY "Merchants can access their own data" ON public.merchants
FOR ALL USING (auth.uid()::text = id::text);

-- Add Row Level Security policies for returns table
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Create policy for returns based on merchant ownership
CREATE POLICY "Merchants can access their own returns" ON public.returns
FOR ALL USING (
  merchant_id IN (
    SELECT id FROM public.merchants WHERE auth.uid()::text = id::text
  )
);

-- Add Row Level Security policies for return_items table
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- Create policy for return_items based on return ownership
CREATE POLICY "Merchants can access their own return items" ON public.return_items
FOR ALL USING (
  return_id IN (
    SELECT id FROM public.returns WHERE merchant_id IN (
      SELECT id FROM public.merchants WHERE auth.uid()::text = id::text
    )
  )
);

-- Add Row Level Security policies for ai_suggestions table
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policy for ai_suggestions based on return ownership
CREATE POLICY "Merchants can access AI suggestions for their returns" ON public.ai_suggestions
FOR ALL USING (
  return_id IN (
    SELECT id FROM public.returns WHERE merchant_id IN (
      SELECT id FROM public.merchants WHERE auth.uid()::text = id::text
    )
  )
);

-- Add Row Level Security policies for analytics_events table
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policy for analytics_events based on merchant ownership
CREATE POLICY "Merchants can access their own analytics events" ON public.analytics_events
FOR ALL USING (
  merchant_id IN (
    SELECT id FROM public.merchants WHERE auth.uid()::text = id::text
  )
);

-- Add Row Level Security policies for billing_records table
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

-- Create policy for billing_records based on merchant ownership
CREATE POLICY "Merchants can access their own billing records" ON public.billing_records
FOR ALL USING (
  merchant_id IN (
    SELECT id FROM public.merchants WHERE auth.uid()::text = id::text
  )
);

-- Add Row Level Security policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users based on merchant ownership
CREATE POLICY "Users can access their merchant's user records" ON public.users
FOR ALL USING (
  merchant_id IN (
    SELECT id FROM public.merchants WHERE auth.uid()::text = id::text
  )
);

-- Add missing foreign key constraints
ALTER TABLE public.returns 
ADD CONSTRAINT fk_returns_merchant 
FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.return_items 
ADD CONSTRAINT fk_return_items_return 
FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;

ALTER TABLE public.ai_suggestions 
ADD CONSTRAINT fk_ai_suggestions_return 
FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;

ALTER TABLE public.analytics_events 
ADD CONSTRAINT fk_analytics_events_merchant 
FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.billing_records 
ADD CONSTRAINT fk_billing_records_merchant 
FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.users 
ADD CONSTRAINT fk_users_merchant 
FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_returns_merchant_id ON public.returns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON public.returns(created_at);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON public.return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_return_id ON public.ai_suggestions(return_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_merchant_id ON public.analytics_events(merchant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
