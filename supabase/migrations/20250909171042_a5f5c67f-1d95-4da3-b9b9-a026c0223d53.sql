-- Recreate has_role function after enum recreation
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

-- Now create the vendor_users table
CREATE TABLE public.vendor_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

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

-- Remove public policies and update existing ones
DROP POLICY IF EXISTS "Public access to campaigns via token" ON public.campaigns;
DROP POLICY IF EXISTS "Public access to campaign posts via token" ON public.campaign_posts;
DROP POLICY IF EXISTS "Public access to campaign creator basic info via token" ON public.campaign_creators;  
DROP POLICY IF EXISTS "Public access to post analytics via token" ON public.post_analytics;

-- Update playlists policy
DROP POLICY IF EXISTS "Admin/manager/vendor can view playlists" ON public.playlists;
CREATE POLICY "Admin/manager/vendor can view playlists" 
ON public.playlists 
FOR SELECT 
USING (
  is_vendor_manager() OR 
  EXISTS (SELECT 1 FROM public.vendor_users WHERE user_id = auth.uid() AND vendor_id = playlists.vendor_id)
);

-- Update tags policy
DROP POLICY IF EXISTS "Authenticated users can view tags" ON public.tags;
CREATE POLICY "Authenticated users can view tags" 
ON public.tags 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create role-specific campaign policies
CREATE POLICY "Salespersons can view their own campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  has_role(auth.uid(), 'salesperson'::app_role) AND 
  campaigns.salesperson = (SELECT email FROM auth.users WHERE id = auth.uid())
);

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

-- Vendor playlist management
CREATE POLICY "Vendors can manage their own playlists" 
ON public.playlists 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.vendor_users WHERE user_id = auth.uid() AND vendor_id = playlists.vendor_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.vendor_users WHERE user_id = auth.uid() AND vendor_id = playlists.vendor_id)
);

-- Create helper functions
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