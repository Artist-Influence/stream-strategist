
-- 1) Drop any legacy/mismatched triggers on campaigns
DROP TRIGGER IF EXISTS enforce_instagram_campaign_source_trigger ON public.campaigns;
DROP TRIGGER IF EXISTS alert_foreign_instagram_campaign_data_trigger ON public.campaigns;
DROP TRIGGER IF EXISTS enforce_artist_influence_spotify_source_trigger ON public.campaigns;
DROP TRIGGER IF EXISTS alert_foreign_campaign_data_trigger ON public.campaigns;

-- 2) Enforce the correct source/type for THIS app (Spotify + campaign_manager)
CREATE OR REPLACE FUNCTION public.enforce_spotify_campaign_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Coerce to the expected identifiers for this project
  NEW.source := 'campaign_manager';
  NEW.campaign_type := 'spotify';
  RETURN NEW;
END;
$function$;

-- 3) Guard against foreign inserts that don't match our app identifiers
CREATE OR REPLACE FUNCTION public.alert_non_spotify_campaign_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.source != 'campaign_manager' OR NEW.campaign_type != 'spotify' THEN
    RAISE WARNING 'SECURITY ALERT: Attempt to insert foreign campaign data. Source: %, Type: %', 
                  NEW.source, NEW.campaign_type;
    RAISE EXCEPTION 'Cross-project data insertion blocked for security. This project only accepts Spotify campaigns from the campaign_manager source.';
  END IF;
  RETURN NEW;
END;
$function$;

-- 4) Apply triggers on campaigns in a safe order (alphabetical: "a_" runs first, "z_" runs last)
DROP TRIGGER IF EXISTS a_enforce_spotify_campaign_source_trigger ON public.campaigns;
CREATE TRIGGER a_enforce_spotify_campaign_source_trigger
BEFORE INSERT ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.enforce_spotify_campaign_source();

DROP TRIGGER IF EXISTS z_alert_non_spotify_campaign_data_trigger ON public.campaigns;
CREATE TRIGGER z_alert_non_spotify_campaign_data_trigger
BEFORE INSERT ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.alert_non_spotify_campaign_data();

-- 5) Ensure updated_at is maintained on UPDATE
DROP TRIGGER IF EXISTS set_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER set_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
