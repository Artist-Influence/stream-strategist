-- Fix campaign constraint and trigger conflicts for Artist Influence Spotify project

-- Drop existing conflicting triggers
DROP TRIGGER IF EXISTS a_enforce_spotify_campaign_source_trigger ON campaigns;
DROP TRIGGER IF EXISTS z_alert_non_spotify_campaign_data_trigger ON campaigns;

-- Update the no_spotify_campaigns constraint to allow artist_influence_spotify_promotion
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS no_spotify_campaigns;
ALTER TABLE campaigns ADD CONSTRAINT no_generic_spotify_campaigns 
  CHECK (campaign_type != 'spotify');

-- Add the correct triggers for Artist Influence project
CREATE TRIGGER a_enforce_artist_influence_source_trigger
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION enforce_artist_influence_spotify_source();

CREATE TRIGGER z_alert_foreign_artist_influence_data_trigger
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION alert_foreign_campaign_data();