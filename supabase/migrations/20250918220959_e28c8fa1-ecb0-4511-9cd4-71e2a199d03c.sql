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

-- Allow vendors to view invoices for campaigns they're allocated to
CREATE POLICY "Vendors can view invoices for their campaigns" 
ON public.campaign_invoices 
FOR SELECT 
USING (
  is_vendor() AND EXISTS (
    SELECT 1 FROM vendor_users vu
    JOIN campaign_allocations_performance cap ON vu.vendor_id = cap.vendor_id
    WHERE vu.user_id = auth.uid() 
    AND cap.campaign_id = campaign_invoices.campaign_id
  )
);