-- Create waitlist table for email signups
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  company VARCHAR(255),
  source VARCHAR(100) DEFAULT 'landing_page',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public waitlist)
CREATE POLICY "Anyone can join waitlist" ON public.waitlist_signups
  FOR INSERT WITH CHECK (true);

-- Create policy to allow reading for admin purposes (optional)
CREATE POLICY "Admin can view waitlist" ON public.waitlist_signups
  FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_waitlist_signups_updated_at
    BEFORE UPDATE ON public.waitlist_signups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();