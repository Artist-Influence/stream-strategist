-- Add data validation to prevent cross-project contamination
-- This ensures only Instagram campaigns from campaign_manager/campaign_intake sources are allowed

-- Drop existing triggers that were enforcing wrong project data
DROP TRIGGER IF EXISTS enforce_artist_influence_spotify_source_trigger ON campaigns;
DROP TRIGGER IF EXISTS alert_foreign_campaign_data_trigger ON campaigns;

-- Create new validation function for Instagram campaign project
CREATE OR REPLACE FUNCTION public.enforce_instagram_campaign_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Force correct source and type for Instagram campaign project
  IF NEW.source NOT IN ('campaign_manager', 'campaign_intake') THEN
    NEW.source := 'campaign_manager';
  END IF;
  
  IF NEW.campaign_type != 'instagram' THEN
    NEW.campaign_type := 'instagram';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create security alert function for foreign data
CREATE OR REPLACE FUNCTION public.alert_foreign_instagram_campaign_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log attempt to insert non-Instagram campaign data
  IF NEW.source NOT IN ('campaign_manager', 'campaign_intake') OR 
     NEW.campaign_type != 'instagram' THEN
    
    RAISE WARNING 'SECURITY ALERT: Attempt to insert foreign campaign data. Source: %, Type: %, Expected: campaign_manager/campaign_intake + instagram', 
                  NEW.source, NEW.campaign_type;
    
    -- Block the insert completely for maximum security
    RAISE EXCEPTION 'Cross-project data insertion blocked for security. This project only accepts Instagram campaigns from campaign_manager/campaign_intake sources.';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the enforcement trigger (corrects data automatically)
CREATE TRIGGER enforce_instagram_campaign_source_trigger
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_instagram_campaign_source();

-- Apply the security alert trigger (blocks foreign data)
CREATE TRIGGER alert_foreign_instagram_campaign_data_trigger
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.alert_foreign_instagram_campaign_data();

-- Update project info function
CREATE OR REPLACE FUNCTION public.get_instagram_campaign_project_info()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN json_build_object(
    'project_name', 'Artist Influence - Instagram Campaign Manager',
    'project_id', 'artist-influence-instagram',
    'source_constants', ARRAY['campaign_manager', 'campaign_intake'],
    'type_constant', 'instagram',
    'security_level', 'MAXIMUM',
    'isolation_status', 'ACTIVE'
  );
END;
$function$;