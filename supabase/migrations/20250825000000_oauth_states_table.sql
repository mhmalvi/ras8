-- Create OAuth state tracking table for secure CSRF protection
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT UNIQUE NOT NULL,
  shop_domain TEXT NOT NULL,
  host_param TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Ensure cleanup
  CONSTRAINT oauth_states_expires_check CHECK (expires_at > created_at)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON oauth_states(state);
CREATE INDEX IF NOT EXISTS oauth_states_expires_idx ON oauth_states(expires_at);

-- Create function to automatically clean up expired states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up RLS (Row Level Security)
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all states
CREATE POLICY "Service role can manage oauth states" 
  ON oauth_states 
  FOR ALL 
  TO service_role 
  USING (true);

-- No public access to OAuth states
CREATE POLICY "No public access to oauth states" 
  ON oauth_states 
  FOR ALL 
  TO anon, authenticated 
  USING (false);

-- Comment on table
COMMENT ON TABLE oauth_states IS 'Temporary storage for OAuth CSRF state parameters during Shopify app installation flow';