-- Ensure billing_records table has proper structure
CREATE TABLE IF NOT EXISTS public.billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL DEFAULT 'starter',
  usage_count INTEGER NOT NULL DEFAULT 0,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for billing_records
DROP POLICY IF EXISTS "Users can view their merchant's billing" ON public.billing_records;
CREATE POLICY "Users can view their merchant's billing" ON public.billing_records
  FOR SELECT
  USING (merchant_id = get_current_user_merchant_id());

DROP POLICY IF EXISTS "Users can update their merchant's billing" ON public.billing_records;
CREATE POLICY "Users can update their merchant's billing" ON public.billing_records
  FOR UPDATE
  USING (merchant_id = get_current_user_merchant_id());

DROP POLICY IF EXISTS "System can insert billing records" ON public.billing_records;
CREATE POLICY "System can insert billing records" ON public.billing_records
  FOR INSERT
  WITH CHECK (true);

-- Create trigger to update usage when returns are processed
CREATE OR REPLACE FUNCTION increment_usage_on_return()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment usage for new returns, not updates
  IF TG_OP = 'INSERT' THEN
    UPDATE public.billing_records 
    SET 
      usage_count = usage_count + 1,
      updated_at = NOW()
    WHERE merchant_id = NEW.merchant_id;
    
    -- If no billing record exists, create one
    IF NOT FOUND THEN
      INSERT INTO public.billing_records (
        merchant_id,
        plan_type,
        usage_count,
        current_period_start,
        current_period_end
      ) VALUES (
        NEW.merchant_id,
        'starter',
        1,
        NOW(),
        NOW() + INTERVAL '1 month'
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on returns table
DROP TRIGGER IF EXISTS increment_usage_trigger ON public.returns;
CREATE TRIGGER increment_usage_trigger
  AFTER INSERT ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION increment_usage_on_return();