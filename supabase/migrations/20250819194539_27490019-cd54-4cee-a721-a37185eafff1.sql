-- Fix remaining security issues with public token access and other tables

-- Fix performance_entries - restrict to admin/manager only  
DROP POLICY IF EXISTS "Authenticated users can manage performance_entries" ON performance_entries;

CREATE POLICY "Admin/manager can view performance entries" ON performance_entries
  FOR SELECT USING (is_vendor_manager());

CREATE POLICY "Admin/manager can insert performance entries" ON performance_entries  
  FOR INSERT WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can update performance entries" ON performance_entries
  FOR UPDATE USING (is_vendor_manager());

CREATE POLICY "Admin/manager can delete performance entries" ON performance_entries
  FOR DELETE USING (is_vendor_manager());

-- Fix weekly_updates - restrict to admin/manager only
DROP POLICY IF EXISTS "Authenticated users can manage weekly_updates" ON weekly_updates;

CREATE POLICY "Admin/manager can view weekly updates" ON weekly_updates
  FOR SELECT USING (is_vendor_manager());

CREATE POLICY "Admin/manager can insert weekly updates" ON weekly_updates
  FOR INSERT WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can update weekly updates" ON weekly_updates  
  FOR UPDATE USING (is_vendor_manager());

CREATE POLICY "Admin/manager can delete weekly updates" ON weekly_updates
  FOR DELETE USING (is_vendor_manager());

-- Fix tags table - restrict modifications to admin/manager only
DROP POLICY IF EXISTS "Allow all operations on tags" ON tags;

CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Admin/manager can insert tags" ON tags
  FOR INSERT WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can update tags" ON tags
  FOR UPDATE USING (is_vendor_manager());

CREATE POLICY "Admin/manager can delete tags" ON tags  
  FOR DELETE USING (is_vendor_manager());

-- Note: Public token access policies for campaigns and campaign_creators are intentional
-- for public campaign viewing functionality. However, we should consider if we need
-- to create views or functions that limit what sensitive data is exposed publicly.
-- For now, keeping existing public token policies as they serve a business purpose.