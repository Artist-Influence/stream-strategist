-- =================================================================
-- FIX SECURITY WARNINGS - Function Search Path Mutable
-- =================================================================
-- Fix the search_path parameter for security functions

-- Fix 1: Update enforce_artist_influence_spotify_source function with secure search_path
CREATE OR REPLACE FUNCTION public.enforce_artist_influence_spotify_source()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Force correct source and type for all campaign inserts in this app
  NEW.source := 'artist_influence_spotify_campaigns';
  NEW.campaign_type := 'artist_influence_spotify_promotion';
  RETURN NEW;
END;
$$;

-- Fix 2: Update alert_foreign_campaign_data function with secure search_path
CREATE OR REPLACE FUNCTION public.alert_foreign_campaign_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log attempt to insert non-Artist Influence data
  IF NEW.source != 'artist_influence_spotify_campaigns' OR 
     NEW.campaign_type != 'artist_influence_spotify_promotion' THEN
    
    RAISE WARNING 'SECURITY ALERT: Attempt to insert foreign campaign data. Source: %, Type: %', 
                  NEW.source, NEW.campaign_type;
    
    -- Block the insert completely
    RAISE EXCEPTION 'Cross-project data insertion blocked for security';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix 3: Update get_artist_influence_project_info function with secure search_path
CREATE OR REPLACE FUNCTION public.get_artist_influence_project_info()
RETURNS json 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN json_build_object(
    'project_name', 'Artist Influence - Spotify Campaign Builder',
    'project_id', 'artist-influence-spotify',
    'source_constant', 'artist_influence_spotify_campaigns',
    'type_constant', 'artist_influence_spotify_promotion',
    'security_level', 'MAXIMUM',
    'isolation_status', 'ACTIVE'
  );
END;
$$;