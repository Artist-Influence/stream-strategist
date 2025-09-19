-- Create function to ensure campaign allocation records exist
CREATE OR REPLACE FUNCTION ensure_campaign_allocation_records(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  vendor_rec RECORD;
  playlist_rec RECORD;
  campaign_rec RECORD;
BEGIN
  -- Get campaign data
  SELECT * INTO campaign_rec FROM campaigns WHERE id = p_campaign_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;
  
  -- Handle vendor_allocations (direct vendor assignments)
  FOR vendor_rec IN 
    SELECT key as vendor_id, value as allocation_data
    FROM jsonb_each(COALESCE(campaign_rec.vendor_allocations, '{}'::jsonb))
  LOOP
    -- Ensure allocation record exists for vendor
    INSERT INTO campaign_allocations_performance (
      campaign_id,
      vendor_id,
      playlist_id,
      allocated_streams,
      predicted_streams,
      actual_streams,
      cost_per_stream,
      performance_score,
      payment_status
    )
    SELECT 
      p_campaign_id,
      vendor_rec.vendor_id::uuid,
      gen_random_uuid(), -- Placeholder playlist_id - will be updated when specific playlists are allocated
      COALESCE((vendor_rec.allocation_data->>'allocated_streams')::integer, 0),
      COALESCE((vendor_rec.allocation_data->>'allocated_streams')::integer, 0),
      0,
      COALESCE(v.cost_per_1k_streams, 0) / 1000.0,
      0,
      'unpaid'
    FROM vendors v 
    WHERE v.id = vendor_rec.vendor_id::uuid
    ON CONFLICT (campaign_id, vendor_id, playlist_id) DO NOTHING;
  END LOOP;
  
  -- Handle selected_playlists (playlist-based assignments)
  FOR playlist_rec IN
    SELECT DISTINCT p.id as playlist_id, p.vendor_id, p.avg_daily_streams
    FROM playlists p
    CROSS JOIN jsonb_array_elements(COALESCE(campaign_rec.selected_playlists, '[]'::jsonb)) AS elem
    WHERE (
      (jsonb_typeof(elem) = 'string' AND p.id::text = trim(both '"' from elem::text))
      OR
      (jsonb_typeof(elem) = 'object' AND (
        p.id::text = (elem->>'id') OR 
        p.id::text = (elem->>'playlist_id')
      ))
    )
  LOOP
    -- Ensure allocation record exists for playlist
    INSERT INTO campaign_allocations_performance (
      campaign_id,
      vendor_id,
      playlist_id,
      allocated_streams,
      predicted_streams,
      actual_streams,
      cost_per_stream,
      performance_score,
      payment_status
    )
    SELECT 
      p_campaign_id,
      playlist_rec.vendor_id,
      playlist_rec.playlist_id,
      playlist_rec.avg_daily_streams,
      playlist_rec.avg_daily_streams,
      0,
      COALESCE(v.cost_per_1k_streams, 0) / 1000.0,
      0,
      'unpaid'
    FROM vendors v 
    WHERE v.id = playlist_rec.vendor_id
    ON CONFLICT (campaign_id, vendor_id, playlist_id) DO NOTHING;
  END LOOP;
  
END;
$$;

-- Create trigger to automatically create allocation records when campaigns are updated
CREATE OR REPLACE FUNCTION trigger_ensure_campaign_allocations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only process if vendor_allocations or selected_playlists changed
  IF (OLD.vendor_allocations IS DISTINCT FROM NEW.vendor_allocations) OR 
     (OLD.selected_playlists IS DISTINCT FROM NEW.selected_playlists) THEN
    PERFORM ensure_campaign_allocation_records(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS ensure_allocations_trigger ON campaigns;
CREATE TRIGGER ensure_allocations_trigger
  AFTER UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ensure_campaign_allocations();

-- Ensure existing campaigns have allocation records
DO $$
DECLARE
  campaign_rec RECORD;
BEGIN
  FOR campaign_rec IN SELECT id FROM campaigns LOOP
    PERFORM ensure_campaign_allocation_records(campaign_rec.id);
  END LOOP;
END;
$$;