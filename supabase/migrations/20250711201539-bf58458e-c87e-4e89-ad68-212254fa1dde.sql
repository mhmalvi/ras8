-- Assign 10 more sample returns to the current user's merchant for testing
UPDATE returns 
SET merchant_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE merchant_id = '351a30a0-fead-4e69-aa2e-1ad2159b5e26'
LIMIT 10;