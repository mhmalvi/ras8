
-- Add token encryption tracking columns to merchants table
ALTER TABLE merchants 
ADD COLUMN token_encrypted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN token_encryption_version INTEGER DEFAULT 1;
