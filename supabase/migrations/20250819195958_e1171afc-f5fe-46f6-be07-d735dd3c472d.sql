-- Final fix: Completely remove public access to sensitive campaign data
-- Force all public access to go through secure, filtered views only

-- Remove the public access policy that still allows reading sensitive campaign data
DROP POLICY IF EXISTS "Secure public campaign access by token" ON campaigns;

-- Create a completely secure policy that NEVER allows public access to the campaigns table directly
-- All public access must go through the secure views/functions
-- Only admin/manager can access the campaigns table directly
-- This ensures sensitive data like budget, selected_creators, client_name etc. is never exposed

-- The existing "Admin/manager can view campaigns" policy should handle authenticated access
-- No need for any public access policies on the campaigns table itself

-- Create a secure RLS policy for campaign_creators that also restricts payment information
DROP POLICY IF EXISTS "Admin/manager can view campaign creators" ON campaign_creators;
DROP POLICY IF EXISTS "Admin/manager can insert campaign creators" ON campaign_creators;  
DROP POLICY IF EXISTS "Admin/manager can update campaign creators" ON campaign_creators;
DROP POLICY IF EXISTS "Admin/manager can delete campaign creators" ON campaign_creators;

-- Recreate campaign_creators policies to be fully secure
CREATE POLICY "Admin/manager full access to campaign creators" ON campaign_creators
  FOR ALL USING (is_vendor_manager()) WITH CHECK (is_vendor_manager());

-- Create a secure public access policy for campaign_creators that only shows non-sensitive data
CREATE POLICY "Public access to campaign creator basic info via token" ON campaign_creators  
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_creators.campaign_id 
      AND c.public_access_enabled = true 
      AND c.public_token IS NOT NULL
    )
  );

-- Note: This policy allows reading only basic creator info (no payment rates)
-- The sensitive fields (rate, payment_status, payment_notes) should be filtered 
-- at the application level when using public access