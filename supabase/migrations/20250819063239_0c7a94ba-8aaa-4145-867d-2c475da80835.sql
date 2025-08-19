-- Create campaign_submissions table for public intake form
CREATE TABLE public.campaign_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_emails TEXT[] NOT NULL,
  campaign_name TEXT NOT NULL,
  price_paid DECIMAL NOT NULL,
  stream_goal INTEGER NOT NULL,
  start_date DATE NOT NULL,
  track_url TEXT NOT NULL,
  notes TEXT,
  salesperson TEXT NOT NULL,
  status TEXT DEFAULT 'pending_approval' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  rejection_reason TEXT
);

-- Add salesperson field to existing campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN salesperson TEXT;

-- Enable RLS on campaign_submissions
ALTER TABLE public.campaign_submissions ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous users to insert submissions (for public form)
CREATE POLICY "Anyone can submit campaigns" 
ON public.campaign_submissions 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow authenticated users to view all submissions (for admin approval)
CREATE POLICY "Authenticated users can view submissions" 
ON public.campaign_submissions 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy to allow admin/manager to update submissions (for approval/rejection)
CREATE POLICY "Admin/manager can update submissions" 
ON public.campaign_submissions 
FOR UPDATE 
USING (is_vendor_manager());