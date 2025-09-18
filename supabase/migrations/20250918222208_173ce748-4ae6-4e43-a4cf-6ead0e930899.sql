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