-- Add admin users to profiles table
-- Run this in the Supabase SQL Editor to add the admin users

-- Get the merchant ID for test-66666666.myshopify.com
DO $$
DECLARE
    merchant_uuid UUID;
BEGIN
    -- Get the merchant UUID
    SELECT id INTO merchant_uuid FROM merchants WHERE shop_domain = 'test-66666666.myshopify.com';
    
    -- Insert admin profiles
    -- Master Admin
    INSERT INTO profiles (
        id,
        email, 
        full_name,
        role,
        merchant_id,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'aalvi.hm@gmail.com',
        'Master Admin',
        'master_admin',
        merchant_uuid,
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        merchant_id = EXCLUDED.merchant_id,
        updated_at = NOW();
    
    -- Merchant Admin
    INSERT INTO profiles (
        id,
        email,
        full_name, 
        role,
        merchant_id,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'quadquetech2020@gmail.com',
        'Merchant Admin',
        'merchant_admin', 
        merchant_uuid,
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        merchant_id = EXCLUDED.merchant_id,
        updated_at = NOW();
    
    -- Merchant Staff
    INSERT INTO profiles (
        id,
        email,
        full_name,
        role, 
        merchant_id,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'yuanhuafung2021@gmail.com',
        'Merchant Staff',
        'merchant_staff',
        merchant_uuid,
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        merchant_id = EXCLUDED.merchant_id,
        updated_at = NOW();
        
END $$;

-- Verify admin users were created
SELECT '👤 ADMIN USERS CREATED:' as header;
SELECT 
    email as "📧 Email",
    full_name as "👤 Name", 
    role as "🔑 Role"
FROM profiles p
JOIN merchants m ON p.merchant_id = m.id
WHERE m.shop_domain = 'test-66666666.myshopify.com'
ORDER BY 
    CASE role 
        WHEN 'master_admin' THEN 1
        WHEN 'merchant_admin' THEN 2  
        WHEN 'merchant_staff' THEN 3
        ELSE 4
    END;