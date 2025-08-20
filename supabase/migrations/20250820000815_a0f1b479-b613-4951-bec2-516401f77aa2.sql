-- Drop and recreate the views to ensure they are SECURITY INVOKER (default)
-- This will fix any Security Definer View issues

-- Drop existing views
DROP VIEW IF EXISTS public.public_campaign_creators;
DROP VIEW IF EXISTS public.public_campaigns;

-- Recreate public_campaigns view with explicit SECURITY INVOKER
CREATE VIEW public.public_campaigns
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  description,
  track_name,
  track_url,
  music_genres,
  content_types,
  territory_preferences,
  post_types,
  sub_genres,
  status,
  start_date,
  duration_days,
  created_at,
  public_token,
  stream_goal AS stream_goal_display,
  brand_name
FROM campaigns
WHERE public_access_enabled = true 
  AND public_token IS NOT NULL;

-- Recreate public_campaign_creators view with explicit SECURITY INVOKER  
CREATE VIEW public.public_campaign_creators
WITH (security_invoker = true)
AS
SELECT 
  cc.id,
  cc.campaign_id,
  cc.posts_count,
  cc.due_date,
  cc.expected_post_date,
  cc.created_at,
  cc.approval_status,
  cc.post_status,
  cc.instagram_handle,
  cc.post_type
FROM campaign_creators cc
JOIN campaigns c ON c.id = cc.campaign_id
WHERE c.public_access_enabled = true 
  AND c.public_token IS NOT NULL;