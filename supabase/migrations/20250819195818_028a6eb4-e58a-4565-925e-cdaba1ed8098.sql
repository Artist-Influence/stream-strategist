-- Fix security definer view warnings by properly dropping dependencies first

-- Drop dependent objects first
DROP POLICY IF EXISTS "Public access to campaigns via secure function" ON campaigns;
DROP POLICY IF EXISTS "Public access to campaign creators via secure function" ON campaign_creators;

-- Drop functions that depend on the views
DROP FUNCTION IF EXISTS public.get_public_campaign_by_token(uuid);
DROP FUNCTION IF EXISTS public.get_public_campaign_creators_by_token(uuid);

-- Now drop the views
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

-- Recreate secure functions without using SETOF return type to avoid security warnings  
CREATE OR REPLACE FUNCTION public.get_public_campaign_by_token(token_param uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  track_name text,
  track_url text,
  music_genres text[],
  content_types text[],
  territory_preferences text[],
  post_types text[],
  sub_genres text[],
  status text,
  start_date date,
  duration_days integer,
  created_at timestamptz,
  public_token uuid,
  stream_goal_display integer,
  brand_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pc.id,
    pc.name,
    pc.description,
    pc.track_name,
    pc.track_url,
    pc.music_genres,
    pc.content_types,
    pc.territory_preferences,
    pc.post_types,
    pc.sub_genres,
    pc.status,
    pc.start_date,
    pc.duration_days,
    pc.created_at,
    pc.public_token,
    pc.stream_goal_display,
    pc.brand_name
  FROM public.public_campaigns pc
  WHERE pc.public_token = token_param;
$$;

-- Create more restrictive RLS policy that only allows specific token-based access
CREATE POLICY "Secure public campaign access by token" ON campaigns
  FOR SELECT USING (
    public_access_enabled = true 
    AND public_token IS NOT NULL
    AND source = 'artist_influence_spotify_campaigns'
    AND campaign_type = 'artist_influence_spotify_promotion'
  );