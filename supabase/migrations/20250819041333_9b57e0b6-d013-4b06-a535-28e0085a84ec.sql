-- Fix creators table security issue by restricting access to admin/manager roles only
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view creator data" ON public.creators;
DROP POLICY IF EXISTS "Authenticated users can insert creator data" ON public.creators;
DROP POLICY IF EXISTS "Authenticated users can update creator data" ON public.creators;
DROP POLICY IF EXISTS "Authenticated users can delete creator data" ON public.creators;

-- Create secure policies that restrict creator data access to admin/manager roles only
CREATE POLICY "Only admin/manager can view creator data"
ON public.creators
FOR SELECT
TO authenticated
USING (is_vendor_manager());

CREATE POLICY "Only admin/manager can insert creator data"
ON public.creators
FOR INSERT
TO authenticated
WITH CHECK (is_vendor_manager());

CREATE POLICY "Only admin/manager can update creator data"
ON public.creators
FOR UPDATE
TO authenticated
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

CREATE POLICY "Only admin/manager can delete creator data"
ON public.creators
FOR DELETE
TO authenticated
USING (is_vendor_manager());