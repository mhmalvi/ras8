-- Fix security warnings by updating function search paths

-- Update increment_usage_on_return function with secure search path
CREATE OR REPLACE FUNCTION increment_usage_on_return()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;