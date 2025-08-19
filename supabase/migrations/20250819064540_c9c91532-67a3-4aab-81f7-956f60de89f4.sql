-- Create salespeople table for tracking
CREATE TABLE public.salespeople (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  total_submissions INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  total_revenue DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on salespeople
ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view salespeople (for admin dashboard)
CREATE POLICY "Authenticated users can view salespeople" 
ON public.salespeople 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy to allow admin/manager to manage salespeople
CREATE POLICY "Admin/manager can manage salespeople" 
ON public.salespeople 
FOR ALL 
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Add trigger for updated_at
CREATE TRIGGER update_salespeople_updated_at
BEFORE UPDATE ON public.salespeople
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();