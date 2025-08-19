-- Check what the linter is actually detecting
-- The linter specifically mentions "Security Definer View" so there might be other issues

-- List all views to see what might be causing the issue
SELECT 
  schemaname,
  viewname
FROM pg_views 
WHERE schemaname IN ('public', 'auth', 'storage');

-- Note: The has_role and is_vendor_manager functions MUST keep SECURITY DEFINER
-- because they need to access user_roles table for RLS policy enforcement
-- This is a legitimate security pattern in Supabase

-- If the linter is still flagging views, it might be a false positive
-- or there might be other views we haven't identified yet