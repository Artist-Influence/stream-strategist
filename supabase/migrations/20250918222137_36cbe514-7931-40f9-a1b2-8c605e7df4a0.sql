-- Allow vendors to view their own vendor record via vendor_users junction table
CREATE POLICY "Vendors can view their own vendor data" 
ON public.vendors 
FOR SELECT 
USING (
  is_vendor() AND EXISTS (
    SELECT 1 FROM vendor_users 
    WHERE vendor_users.user_id = auth.uid() 
    AND vendor_users.vendor_id = vendors.id
  )
);