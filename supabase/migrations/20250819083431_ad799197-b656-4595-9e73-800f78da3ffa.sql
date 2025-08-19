-- =================================================================
-- CRITICAL PROJECT ISOLATION - Artist Influence Spotify Campaigns
-- =================================================================
-- This migration implements strict data separation to prevent cross-project contamination

-- 1. Create app-specific RLS policies that ONLY allow access to THIS project's data
DROP POLICY IF EXISTS "Campaigns - Artist Influence Spotify Only" ON public.campaigns;
CREATE POLICY "Campaigns - Artist Influence Spotify Only" 
ON public.campaigns 
FOR ALL 
USING (
  source = 'artist_influence_spotify_campaigns' 
  AND campaign_type = 'artist_influence_spotify_promotion'
) 
WITH CHECK (
  source = 'artist_influence_spotify_campaigns' 
  AND campaign_type = 'artist_influence_spotify_promotion'
);

-- 2. Create validation trigger to ENFORCE correct source/type on inserts
CREATE OR REPLACE FUNCTION public.enforce_artist_influence_spotify_source()
RETURNS TRIGGER AS $$
BEGIN
  -- Force correct source and type for all campaign inserts in this app
  NEW.source := 'artist_influence_spotify_campaigns';
  NEW.campaign_type := 'artist_influence_spotify_promotion';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_artist_influence_spotify_source_trigger ON public.campaigns;
CREATE TRIGGER enforce_artist_influence_spotify_source_trigger
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_artist_influence_spotify_source();

-- 3. Create monitoring function to alert on foreign data attempts  
CREATE OR REPLACE FUNCTION public.alert_foreign_campaign_data()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create monitoring trigger (runs after the enforcement trigger)
DROP TRIGGER IF EXISTS alert_foreign_campaign_data_trigger ON public.campaigns;
CREATE TRIGGER alert_foreign_campaign_data_trigger
  AFTER INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.alert_foreign_campaign_data();

-- 4. Create project metadata function for debugging
CREATE OR REPLACE FUNCTION public.get_artist_influence_project_info()
RETURNS json AS $$
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
$$ LANGUAGE plpgsql;