
-- Drop the existing constraint that's causing issues
ALTER TABLE public.ai_suggestions 
DROP CONSTRAINT IF EXISTS ai_suggestions_suggestion_type_check;

-- Create a new constraint that allows the values we're using
ALTER TABLE public.ai_suggestions 
ADD CONSTRAINT ai_suggestions_suggestion_type_check 
CHECK (suggestion_type IN ('product_exchange', 'refund', 'store_credit', 'exchange'));
