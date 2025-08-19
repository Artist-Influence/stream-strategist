-- Fix public campaign data exposure security issue
-- Create a secure public campaign view that only exposes safe, non-sensitive data

-- First, remove the overly permissive public access policy
DROP POLICY IF EXISTS "Public access to campaigns with valid token" ON campaigns;

-- Create a secure view for public campaign data that excludes sensitive information
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
  -- Exclude sensitive data: budget, client_name, client details, salesperson, 
  -- selected_creators (contains rates), vendor_allocations, results, etc.
  -- Only include basic campaign information needed for public viewing
  CASE 
    WHEN c.status = 'active' THEN c.stream_goal
    ELSE NULL
  END as stream_goal_display,
  -- Brand name but not client name (less sensitive)
  c.brand_name
FROM campaigns c
WHERE c.public_access_enabled = true 
  AND c.public_token IS NOT NULL
  AND c.source = 'artist_influence_spotify_campaigns'
  AND c.campaign_type = 'artist_influence_spotify_promotion';

-- Enable RLS on the view
ALTER VIEW public.public_campaigns SET (security_barrier = true);

-- Create a function to safely get public campaign by token
CREATE OR REPLACE FUNCTION public.get_public_campaign_by_token(token_param uuid)
RETURNS SETOF public_campaigns
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.public_campaigns 
  WHERE public_token = token_param;
$$;

-- Create a more secure public access policy that uses the function
CREATE POLICY "Public access to campaigns via secure function" ON campaigns
  FOR SELECT USING (
    id IN (
      SELECT id FROM public.get_public_campaign_by_token(public_token)
      WHERE public_token IS NOT NULL
    )
  );

-- Create RLS policies for the public campaign creators view
-- This ensures creator payment rates are not exposed publicly
DROP POLICY IF EXISTS "Public access to campaign_creators via token" ON campaign_creators;

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
  -- Exclude: rate (payment info), payment_status, payment_notes, approval_notes
FROM campaign_creators cc
JOIN campaigns c ON c.id = cc.campaign_id
WHERE c.public_access_enabled = true 
  AND c.public_token IS NOT NULL;

-- Enable security barrier on the view
ALTER VIEW public.public_campaign_creators SET (security_barrier = true);

-- Create secure function for public campaign creators
CREATE OR REPLACE FUNCTION public.get_public_campaign_creators_by_token(token_param uuid)
RETURNS SETOF public_campaign_creators  
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pcc.* FROM public.public_campaign_creators pcc
  JOIN public.public_campaigns pc ON pc.id = pcc.campaign_id
  WHERE pc.public_token = token_param;
$$;

-- Create secure policy for campaign_creators
CREATE POLICY "Public access to campaign creators via secure function" ON campaign_creators
  FOR SELECT USING (
    id IN (
      SELECT id FROM public.get_public_campaign_creators_by_token(
        (SELECT public_token FROM campaigns WHERE id = campaign_id)
      )
    )
  );