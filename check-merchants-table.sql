-- Check the merchants table structure and existing data
-- Run this first to understand the table schema

-- Check existing merchants
SELECT * FROM merchants LIMIT 5;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'merchants' 
AND table_schema = 'public'
ORDER BY ordinal_position;