-- Fix playlists table security issue - restrict public access and implement proper role-based permissions
-- Drop the overly permissive "Allow all operations" policy  
DROP POLICY IF EXISTS "Allow all operations on playlists" ON public.playlists;

-- Allow all authenticated users to view playlists (needed for campaign creation)
-- But restrict management operations to admin/manager roles only
CREATE POLICY "Authenticated users can view playlists"
ON public.playlists
FOR SELECT
TO authenticated
USING (true);

-- Only admin/manager can manage playlist data (contains sensitive vendor relationships)
CREATE POLICY "Only admin/manager can insert playlists"
ON public.playlists
FOR INSERT
TO authenticated
WITH CHECK (is_vendor_manager());

CREATE POLICY "Only admin/manager can update playlists"
ON public.playlists
FOR UPDATE
TO authenticated
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

CREATE POLICY "Only admin/manager can delete playlists"
ON public.playlists
FOR DELETE
TO authenticated
USING (is_vendor_manager());