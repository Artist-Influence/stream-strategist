-- Fix overly permissive RLS policies for security

-- Drop existing overly permissive policies on campaigns
DROP POLICY IF EXISTS "All authenticated users can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "All authenticated users can insert campaigns" ON campaigns;  
DROP POLICY IF EXISTS "All authenticated users can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "All authenticated users can delete campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can view campaign data" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaign data" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaign data" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaign data" ON campaigns;

-- Create restrictive campaign policies - only admin/manager can access
CREATE POLICY "Admin/manager can view campaigns" ON campaigns
  FOR SELECT USING (is_vendor_manager());

CREATE POLICY "Admin/manager can insert campaigns" ON campaigns  
  FOR INSERT WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can update campaigns" ON campaigns
  FOR UPDATE USING (is_vendor_manager());

CREATE POLICY "Admin/manager can delete campaigns" ON campaigns
  FOR DELETE USING (is_vendor_manager());

-- Fix clients table - restrict to admin/manager only
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;

-- Keep existing restrictive policies for vendors, creators, playlists as they are already secure

-- Fix campaign_creators policies - restrict to admin/manager  
DROP POLICY IF EXISTS "Users can view campaign creators they manage" ON campaign_creators;
DROP POLICY IF EXISTS "Users can insert campaign creators" ON campaign_creators;
DROP POLICY IF EXISTS "Users can update campaign creators" ON campaign_creators;
DROP POLICY IF EXISTS "Users can delete campaign creators" ON campaign_creators;

CREATE POLICY "Admin/manager can view campaign creators" ON campaign_creators
  FOR SELECT USING (is_vendor_manager());

CREATE POLICY "Admin/manager can insert campaign creators" ON campaign_creators
  FOR INSERT WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can update campaign creators" ON campaign_creators  
  FOR UPDATE USING (is_vendor_manager());

CREATE POLICY "Admin/manager can delete campaign creators" ON campaign_creators
  FOR DELETE USING (is_vendor_manager());

-- Fix client_credits - restrict to admin/manager only
DROP POLICY IF EXISTS "Authenticated users can view client credits" ON client_credits;

-- Keep existing "Only admin/manager can manage client credits" policy

-- Keep existing salespeople policies as they allow viewing for authenticated users which may be needed

-- Keep public token access for campaigns (this is intentional for public campaign viewing)
-- Keep public access policies for campaign_posts and post_analytics via token (intentional for public viewing)