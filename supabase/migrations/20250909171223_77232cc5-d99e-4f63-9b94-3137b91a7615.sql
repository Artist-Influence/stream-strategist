-- Create RLS policies for vendor_users table
CREATE POLICY "Vendors can view their own mapping" 
ON public.vendor_users 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admin/manager can manage vendor mappings" 
ON public.vendor_users 
FOR ALL 
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Create role-based helper functions using new enum values
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
CREATE POLICY "Salespersons can view their own campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  is_salesperson() AND 
  campaigns.salesperson = (SELECT email FROM auth.users WHERE id = auth.uid())
);

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

-- Update playlist policies for vendor access
DROP POLICY IF EXISTS "Admin/manager/vendor can view playlists" ON public.playlists;
CREATE POLICY "Admin/manager/vendor can view playlists" 
ON public.playlists 
FOR SELECT 
USING (
  is_vendor_manager() OR 
  EXISTS (SELECT 1 FROM public.vendor_users WHERE user_id = auth.uid() AND vendor_id = playlists.vendor_id)
);

CREATE POLICY "Vendors can manage their own playlists" 
ON public.playlists 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.vendor_users WHERE user_id = auth.uid() AND vendor_id = playlists.vendor_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.vendor_users WHERE user_id = auth.uid() AND vendor_id = playlists.vendor_id)
);

-- Update tags policy to require authentication
DROP POLICY IF EXISTS "Authenticated users can view tags" ON public.tags;
CREATE POLICY "Authenticated users can view tags" 
ON public.tags 
FOR SELECT 
USING (auth.uid() IS NOT NULL);