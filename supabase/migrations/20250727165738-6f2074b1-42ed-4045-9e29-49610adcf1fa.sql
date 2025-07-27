-- Fix security warnings by properly handling function dependencies

-- Drop and recreate the update function with CASCADE
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
DROP FUNCTION IF EXISTS public.update_notifications_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notifications_updated_at();

-- Drop and recreate the other triggers and functions
DROP TRIGGER IF EXISTS return_notification_trigger ON public.returns;
DROP TRIGGER IF EXISTS ai_suggestion_notification_trigger ON public.ai_suggestions;
DROP FUNCTION IF EXISTS public.notify_return_events() CASCADE;
DROP FUNCTION IF EXISTS public.notify_ai_suggestion_events() CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(UUID, VARCHAR(50), VARCHAR(255), TEXT, VARCHAR(20), JSONB) CASCADE;

-- Recreate create_notification function with proper search_path
CREATE OR REPLACE FUNCTION public.create_notification(
  p_merchant_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    merchant_id,
    type,
    title,
    message,
    priority,
    data
  ) VALUES (
    p_merchant_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_data
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Recreate notify_return_events function with proper search_path
CREATE OR REPLACE FUNCTION public.notify_return_events()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- New return request
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.merchant_id,
      'return',
      'New Return Request',
      'Customer ' || NEW.customer_email || ' requested return for Order #' || NEW.shopify_order_id,
      'high',
      jsonb_build_object(
        'return_id', NEW.id,
        'order_id', NEW.shopify_order_id,
        'customer_email', NEW.customer_email
      )
    );
    RETURN NEW;
  END IF;

  -- Return status update
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.create_notification(
      NEW.merchant_id,
      'return_status',
      'Return Status Updated',
      'Return for Order #' || NEW.shopify_order_id || ' status changed to ' || NEW.status,
      CASE 
        WHEN NEW.status = 'completed' THEN 'low'
        WHEN NEW.status = 'approved' THEN 'medium'
        ELSE 'medium'
      END,
      jsonb_build_object(
        'return_id', NEW.id,
        'order_id', NEW.shopify_order_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate notify_ai_suggestion_events function with proper search_path
CREATE OR REPLACE FUNCTION public.notify_ai_suggestion_events()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  merchant_id_val UUID;
BEGIN
  -- Get merchant_id from the related return
  SELECT r.merchant_id INTO merchant_id_val
  FROM public.returns r
  WHERE r.id = NEW.return_id;

  IF merchant_id_val IS NOT NULL THEN
    PERFORM public.create_notification(
      merchant_id_val,
      'ai_suggestion',
      'AI Suggestion Available',
      'High confidence suggestion available (' || ROUND(NEW.confidence_score * 100) || '% match)',
      'medium',
      jsonb_build_object(
        'return_id', NEW.return_id,
        'suggestion_id', NEW.id,
        'confidence_score', NEW.confidence_score,
        'suggestion_type', NEW.suggestion_type
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER return_notification_trigger
  AFTER INSERT OR UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_return_events();

CREATE TRIGGER ai_suggestion_notification_trigger
  AFTER INSERT ON public.ai_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ai_suggestion_events();