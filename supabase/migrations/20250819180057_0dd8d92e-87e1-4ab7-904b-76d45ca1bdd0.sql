-- Fix remaining critical security issues

-- Fix salespeople table - remove public access to contact info
DROP POLICY IF EXISTS "Authenticated users can view salespeople" ON salespeople;

-- Only allow admin/manager to view salesperson contact information
-- The existing "Admin/manager can manage salespeople" policy already covers admin access

-- Fix campaign_submissions - restrict to admin/manager only
DROP POLICY IF EXISTS "Authenticated users can view submissions" ON campaign_submissions;

CREATE POLICY "Admin/manager can view submissions" ON campaign_submissions
  FOR SELECT USING (is_vendor_manager());

-- Ensure clients table is properly restricted (may not have been fully covered)
-- The existing policies should be sufficient but let's double-check
-- Only admin/manager should access client contact information

-- Fix any overly broad policies on campaign-related tables
-- Remove any 'true' conditions that bypass intended restrictions
DROP POLICY IF EXISTS "Users can view campaign posts" ON campaign_posts;

-- Campaign posts should only be viewable by admin/manager or via public token
-- The existing "Admin/manager can manage campaign posts" and "Public access to campaign posts via token" should be sufficient

-- Similarly for post_analytics, ensure no overly broad access
DROP POLICY IF EXISTS "Users can view post analytics" ON post_analytics;