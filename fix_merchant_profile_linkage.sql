-- Fix merchant profile linkage for user yuanhuafung2021@gmail.com
-- This script will check and repair the merchant-profile relationship

DO $$
DECLARE
    user_id UUID;
    user_merchant_id UUID;
    merchant_count INTEGER;
    existing_merchant_id UUID;
BEGIN
    -- Get the user ID
    SELECT id, merchant_id INTO user_id, user_merchant_id
    FROM profiles 
    WHERE email = 'yuanhuafung2021@gmail.com';
    
    RAISE NOTICE 'User ID: %, Current merchant_id: %', user_id, user_merchant_id;
    
    -- Check how many merchants exist
    SELECT COUNT(*) INTO merchant_count FROM merchants;
    RAISE NOTICE 'Total merchants in system: %', merchant_count;
    
    -- If user doesn't have a merchant_id, try to find an existing merchant
    IF user_merchant_id IS NULL THEN
        -- Look for an existing merchant that might belong to this user
        -- Priority 1: Look for merchant with matching shop domain from logs
        SELECT id INTO existing_merchant_id 
        FROM merchants 
        WHERE shop_domain LIKE '%techgear-store%' 
           OR shop_domain LIKE '%test-%'
        ORDER BY created_at DESC 
        LIMIT 1;
        
        -- Priority 2: If no specific match, get the most recent active merchant
        IF existing_merchant_id IS NULL THEN
            SELECT id INTO existing_merchant_id 
            FROM merchants 
            WHERE status = 'active'
            ORDER BY created_at DESC 
            LIMIT 1;
        END IF;
        
        -- Priority 3: If still no match, get any merchant
        IF existing_merchant_id IS NULL THEN
            SELECT id INTO existing_merchant_id 
            FROM merchants 
            ORDER BY created_at DESC 
            LIMIT 1;
        END IF;
        
        -- Link the user to the merchant
        IF existing_merchant_id IS NOT NULL THEN
            UPDATE profiles 
            SET merchant_id = existing_merchant_id,
                updated_at = NOW()
            WHERE id = user_id;
            
            RAISE NOTICE 'Linked user % to merchant %', user_id, existing_merchant_id;
            
            -- Ensure the merchant is active
            UPDATE merchants 
            SET status = 'active',
                updated_at = NOW()
            WHERE id = existing_merchant_id;
            
            RAISE NOTICE 'Set merchant % status to active', existing_merchant_id;
        ELSE
            RAISE NOTICE 'No merchants found to link to user %', user_id;
        END IF;
    ELSE
        RAISE NOTICE 'User already has merchant_id: %', user_merchant_id;
        
        -- Ensure the linked merchant is active
        UPDATE merchants 
        SET status = 'active',
            updated_at = NOW()
        WHERE id = user_merchant_id;
        
        RAISE NOTICE 'Ensured merchant % is active', user_merchant_id;
    END IF;
    
    -- Verify the fix worked
    RAISE NOTICE '=== VERIFICATION ===';
    FOR user_id, user_merchant_id IN 
        SELECT p.id, p.merchant_id
        FROM profiles p
        WHERE p.email = 'yuanhuafung2021@gmail.com'
    LOOP
        RAISE NOTICE 'User ID: %, Merchant ID: %', user_id, user_merchant_id;
    END LOOP;
    
END $$;