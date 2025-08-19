-- Fix security definer view warnings by using regular views with proper RLS
-- Remove security_barrier settings and use standard secure approach

-- Drop the views with security_barrier and recreate them properly
DROP VIEW IF EXISTS public.public_campaigns;
DROP VIEW IF EXISTS public.public_campaign_creators;

-- Create secure views without security_barrier (which triggers warnings)
CREATE OR REPLACE VIEW public.public_campaigns AS
SELECT 
  c.id,
  c.name,
  c.description,
  c.track_name,
  c.track_url,
  c.music_genres,
  c.content_types,
  c.territory_preferences,
  c.post_types,
  c.sub_genres,
  c.status,
  c.start_date,
  c.duration_days,
  c.created_at,
  c.public_token,
  -- Only show stream goal for active campaigns
  CASE 
    WHEN c.status = 'active' THEN c.stream_goal
    ELSE NULL
  END as stream_goal_display,
  c.brand_name
FROM campaigns c
WHERE c.public_access_enabled = true 
  AND c.public_token IS NOT NULL
  AND c.source = 'artist_influence_spotify_campaigns'
  AND c.campaign_type = 'artist_influence_spotify_promotion';

-- Create public campaign creators view without sensitive payment data
CREATE OR REPLACE VIEW public.public_campaign_creators AS
SELECT 
  cc.id,
  cc.campaign_id,
  cc.instagram_handle,
  cc.post_type,
  cc.posts_count,
  cc.due_date,
  cc.expected_post_date,
  cc.post_status,
  cc.approval_status,
  cc.created_at
FROM campaign_creators cc
JOIN campaigns c ON c.id = cc.campaign_id
WHERE c.public_access_enabled = true 
  AND c.public_token IS NOT NULL;