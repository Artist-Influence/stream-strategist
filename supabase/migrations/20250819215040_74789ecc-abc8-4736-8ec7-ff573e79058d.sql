-- Fix Security Definer issue by refactoring get_public_campaign_by_token function
-- Remove SECURITY DEFINER and let it rely on RLS policies instead

-- Drop the existing SECURITY DEFINER function
DROP FUNCTION IF EXISTS public.get_public_campaign_by_token(uuid);

-- Create a new version without SECURITY DEFINER that uses the public_campaigns view
-- This function will now respect RLS policies of the querying user
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
  created_at timestamp with time zone, 
  public_token uuid, 
  stream_goal_display integer, 
  brand_name text
)
LANGUAGE sql
STABLE
-- Removed SECURITY DEFINER - now uses SECURITY INVOKER (default)
SET search_path TO 'public'
AS $function$
  -- Use the public_campaigns view which already has proper filtering
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
$function$;

-- The function now relies on the RLS policies of the underlying tables
-- rather than bypassing them with SECURITY DEFINER