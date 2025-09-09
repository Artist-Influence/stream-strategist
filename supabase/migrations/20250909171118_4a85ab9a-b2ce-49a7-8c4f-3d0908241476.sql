-- Add new enum values to existing app_role type
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'salesperson';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Create vendor_users table
CREATE TABLE IF NOT EXISTS public.vendor_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_users
DROP POLICY IF EXISTS "Vendors can view their own mapping" ON public.vendor_users;
CREATE POLICY "Vendors can view their own mapping" 
ON public.vendor_users 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin/manager can manage vendor mappings" ON public.vendor_users;
CREATE POLICY "Admin/manager can manage vendor mappings" 
ON public.vendor_users 
FOR ALL 
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Remove all public access policies
DROP POLICY IF EXISTS "Public access to campaigns via token" ON public.campaigns;
DROP POLICY IF EXISTS "Public access to campaign posts via token" ON public.campaign_posts;
DROP POLICY IF EXISTS "Public access to campaign creator basic info via token" ON public.campaign_creators;  
DROP POLICY IF EXISTS "Public access to post analytics via token" ON public.post_analytics;

-- Create role-based helper functions
CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'vendor'::app_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_salesperson()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'salesperson'::app_role
  );
$function$;

-- Create role-specific campaign access policies
DROP POLICY IF EXISTS "Salespersons can view their own campaigns" ON public.campaigns;
CREATE POLICY "Salespersons can view their own campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  is_salesperson() AND 
  campaigns.salesperson = (SELECT email FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Vendors can view assigned campaigns" ON public.campaigns;
CREATE POLICY "Vendors can view assigned campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  is_vendor() AND 
  EXISTS (
    SELECT 1 FROM public.vendor_users vu 
    JOIN jsonb_array_elements_text(campaigns.selected_playlists::jsonb) AS playlist_id ON true
    JOIN public.playlists p ON p.id::text = playlist_id
    WHERE vu.user_id = auth.uid() AND vu.vendor_id = p.vendor_id
  )
);