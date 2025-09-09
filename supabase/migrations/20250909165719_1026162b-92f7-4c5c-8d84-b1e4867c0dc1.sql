-- Update app_role enum to include new roles
DROP TYPE IF EXISTS app_role CASCADE;
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'salesperson', 'vendor');

-- Create vendor_users table to link vendors with auth users
CREATE TABLE public.vendor_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

-- Enable RLS on vendor_users
ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_users
CREATE POLICY "Vendors can view their own mapping" 
ON public.vendor_users 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admin/manager can manage vendor mappings" 
ON public.vendor_users 
FOR ALL 
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Update RLS policies to remove public access

-- Remove public policies from campaigns
DROP POLICY IF EXISTS "Public access to campaigns via token" ON public.campaigns;

-- Remove public policies from campaign_posts  
DROP POLICY IF EXISTS "Public access to campaign posts via token" ON public.campaign_posts;

-- Remove public policies from campaign_creators
DROP POLICY IF EXISTS "Public access to campaign creator basic info via token" ON public.campaign_creators;

-- Remove public policies from post_analytics
DROP POLICY IF EXISTS "Public access to post analytics via token" ON public.post_analytics;

-- Update playlists policy to require authentication
DROP POLICY IF EXISTS "Authenticated users can view playlists" ON public.playlists;
CREATE POLICY "Admin/manager/vendor can view playlists" 
ON public.playlists 
FOR SELECT 
USING (
  is_vendor_manager() OR 
  EXISTS (SELECT 1 FROM public.vendor_users WHERE user_id = auth.uid() AND vendor_id = playlists.vendor_id)
);

-- Update tags policy to require authentication  
DROP POLICY IF EXISTS "Anyone can view tags" ON public.tags;
CREATE POLICY "Authenticated users can view tags" 
ON public.tags 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create salesperson-specific policies for campaigns
CREATE POLICY "Salespersons can view their own campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  has_role(auth.uid(), 'salesperson'::app_role) AND 
  campaigns.salesperson = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Create vendor-specific policies for campaigns
CREATE POLICY "Vendors can view assigned campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  has_role(auth.uid(), 'vendor'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.vendor_users vu 
    JOIN jsonb_array_elements_text(campaigns.selected_playlists::jsonb) AS playlist_id ON true
    JOIN public.playlists p ON p.id::text = playlist_id
    WHERE vu.user_id = auth.uid() AND vu.vendor_id = p.vendor_id
  )
);

-- Vendor playlist management policies
CREATE POLICY "Vendors can manage their own playlists" 
ON public.playlists 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.vendor_users WHERE user_id = auth.uid() AND vendor_id = playlists.vendor_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.vendor_users WHERE user_id = auth.uid() AND vendor_id = playlists.vendor_id)
);

-- Create function to check if user is a vendor
CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'vendor'
  );
$function$;

-- Create function to check if user is a salesperson
CREATE OR REPLACE FUNCTION public.is_salesperson()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'salesperson'
  );
$function$;