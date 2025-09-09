-- Create campaign vendor requests table to track vendor responses to campaigns
CREATE TABLE public.campaign_vendor_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  playlist_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  response_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, vendor_id)
);

-- Enable RLS
ALTER TABLE public.campaign_vendor_requests ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own requests
CREATE POLICY "Vendors can view their own requests" 
ON public.campaign_vendor_requests 
FOR SELECT 
USING (
  is_vendor() AND EXISTS (
    SELECT 1 FROM vendor_users 
    WHERE user_id = auth.uid() AND vendor_id = campaign_vendor_requests.vendor_id
  )
);

-- Vendors can update their own requests (respond to them)
CREATE POLICY "Vendors can respond to their own requests" 
ON public.campaign_vendor_requests 
FOR UPDATE 
USING (
  is_vendor() AND EXISTS (
    SELECT 1 FROM vendor_users 
    WHERE user_id = auth.uid() AND vendor_id = campaign_vendor_requests.vendor_id
  )
);

-- Admin/manager can manage all requests
CREATE POLICY "Admin/manager can manage all vendor requests" 
ON public.campaign_vendor_requests 
FOR ALL 
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Create trigger for updated_at
CREATE TRIGGER update_campaign_vendor_requests_updated_at
BEFORE UPDATE ON public.campaign_vendor_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();