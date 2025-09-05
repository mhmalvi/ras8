-- Test if embedded context functions exist and work
-- This will help us understand if the migration was applied

-- Test 1: Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'merchants' 
  AND column_name IN ('host_param', 'embedded_mode', 'app_url', 'last_embedded_session');

-- Test 2: Check if functions exist
SELECT proname, prokind, proargnames
FROM pg_proc 
WHERE proname IN ('store_embedded_context', 'get_embedded_context', 'update_embedded_context_from_auth');

-- Test 3: Try to call get_embedded_context function (if it exists)
-- This will fail safely if function doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_embedded_context') THEN
        RAISE NOTICE 'get_embedded_context function exists';
        -- Test with a sample user ID (this will fail if no matching user, but that's OK)
        PERFORM get_embedded_context('24d1d8c1-d68c-4378-a6ae-93521286d0bc');
        RAISE NOTICE 'get_embedded_context function callable';
    ELSE
        RAISE NOTICE 'get_embedded_context function does NOT exist';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error testing get_embedded_context: %', SQLERRM;
END $$;