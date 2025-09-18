-- Allow vendors to view campaign allocations where they are the vendor
CREATE POLICY "Vendors can view their own campaign allocations performance" 
ON public.campaign_allocations_performance 
FOR SELECT 
USING (
  is_vendor() AND EXISTS (
    SELECT 1 FROM vendor_users 
    WHERE vendor_users.user_id = auth.uid() 
    AND vendor_users.vendor_id = campaign_allocations_performance.vendor_id
  )
);