
-- First, let's ensure we have a profiles table that can handle master admin roles
-- Update the profiles table to allow master_admin role if it doesn't exist
DO $$ 
BEGIN
    -- Check if master_admin is already in the role enum, if not add it
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'master_admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        -- If user_role enum doesn't exist, create it
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('admin', 'staff', 'merchant', 'master_admin');
        ELSE
            ALTER TYPE user_role ADD VALUE 'master_admin';
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If the enum doesn't exist at all, create it
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'merchant', 'master_admin');
END $$;

-- Ensure the role column exists and uses the enum
DO $$
BEGIN
    -- Check if role column exists and update it to use enum if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role' AND data_type = 'text') THEN
        -- Convert existing text role column to enum
        ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        -- Add role column if it doesn't exist
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'merchant';
    END IF;
END $$;

-- Create or update the profile for the master admin user
-- Note: This assumes the user will sign up first, then we'll update their role
-- We'll use an upsert operation that will work once the user account exists
INSERT INTO profiles (id, email, role, first_name, last_name, created_at, updated_at)
SELECT 
    id,
    email,
    'master_admin'::user_role,
    COALESCE(raw_user_meta_data->>'first_name', 'Master'),
    COALESCE(raw_user_meta_data->>'last_name', 'Admin'),
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'aalvi.hm@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'master_admin'::user_role,
    updated_at = NOW();

-- If the user doesn't exist yet in auth.users, we'll create a placeholder profile
-- that will be updated when they sign up
INSERT INTO profiles (id, email, role, first_name, last_name, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'aalvi.hm@gmail.com',
    'master_admin'::user_role,
    'Master',
    'Admin',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'aalvi.hm@gmail.com')
ON CONFLICT (email) DO NOTHING;
