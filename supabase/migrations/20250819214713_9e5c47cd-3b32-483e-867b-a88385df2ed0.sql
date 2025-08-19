-- Fix Security Definer Views
-- Remove SECURITY DEFINER from views to ensure proper RLS policy enforcement
-- Views should respect the querying user's permissions, not the creator's

-- Drop existing views that may have SECURITY DEFINER
DROP VIEW IF EXISTS public.public_campaigns;
DROP VIEW IF EXISTS public.public_campaign_creators;

-- Recreate views without SECURITY DEFINER (default is SECURITY INVOKER)
-- These views will now properly respect RLS policies of underlying tables
CREATE VIEW public.public_campaigns AS
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
  stream_goal as stream_goal_display,
  brand_name
FROM public.campaigns
WHERE public_access_enabled = true 
AND public_token IS NOT NULL;

-- Create public campaign creators view without SECURITY DEFINER
CREATE VIEW public.public_campaign_creators AS
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
  -- Deliberately exclude sensitive fields: rate, payment_status, payment_notes, creator_id
FROM public.campaign_creators cc
INNER JOIN public.campaigns c ON c.id = cc.campaign_id
WHERE c.public_access_enabled = true 
AND c.public_token IS NOT NULL;

-- Note: These views now rely on RLS policies of the underlying tables
-- This ensures proper security enforcement based on the querying user's permissions