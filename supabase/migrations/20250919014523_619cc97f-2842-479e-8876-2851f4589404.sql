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
  
  -- Handle vendor_allocations (direct vendor assignments) - only if it's an object
  IF jsonb_typeof(COALESCE(campaign_rec.vendor_allocations, '{}'::jsonb)) = 'object' THEN
    FOR vendor_rec IN 
      SELECT key as vendor_id, value as allocation_data
      FROM jsonb_each(campaign_rec.vendor_allocations)
    LOOP
      -- Check if allocation record exists for this vendor (using a placeholder playlist)
      IF NOT EXISTS (
        SELECT 1 FROM campaign_allocations_performance 
        WHERE campaign_id = p_campaign_id 
        AND vendor_id = vendor_rec.vendor_id::uuid
      ) THEN
        -- Create allocation record for vendor
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
          gen_random_uuid(), -- Placeholder playlist_id
          COALESCE((vendor_rec.allocation_data->>'allocated_streams')::integer, 0),
          COALESCE((vendor_rec.allocation_data->>'allocated_streams')::integer, 0),
          0,
          COALESCE(v.cost_per_1k_streams, 0) / 1000.0,
          0,
          'unpaid'
        FROM vendors v 
        WHERE v.id = vendor_rec.vendor_id::uuid;
      END IF;
    END LOOP;
  END IF;
  
  -- Handle selected_playlists (playlist-based assignments) - only if it's an array
  IF jsonb_typeof(COALESCE(campaign_rec.selected_playlists, '[]'::jsonb)) = 'array' THEN
    FOR playlist_rec IN
      SELECT DISTINCT p.id as playlist_id, p.vendor_id, p.avg_daily_streams
      FROM playlists p
      CROSS JOIN jsonb_array_elements(campaign_rec.selected_playlists) AS elem
      WHERE (
        (jsonb_typeof(elem) = 'string' AND p.id::text = trim(both '"' from elem::text))
        OR
        (jsonb_typeof(elem) = 'object' AND (
          p.id::text = (elem->>'id') OR 
          p.id::text = (elem->>'playlist_id')
        ))
      )
    LOOP
      -- Check if allocation record exists for this playlist
      IF NOT EXISTS (
        SELECT 1 FROM campaign_allocations_performance 
        WHERE campaign_id = p_campaign_id 
        AND vendor_id = playlist_rec.vendor_id 
        AND playlist_id = playlist_rec.playlist_id
      ) THEN
        -- Create allocation record for playlist
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
        WHERE v.id = playlist_rec.vendor_id;
      END IF;
    END LOOP;
  END IF;
  
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

-- Ensure existing campaigns have allocation records (process in smaller batches)
DO $$
DECLARE
  campaign_rec RECORD;
  batch_count INTEGER := 0;
BEGIN
  FOR campaign_rec IN SELECT id FROM campaigns ORDER BY created_at DESC LIMIT 50 LOOP
    BEGIN
      PERFORM ensure_campaign_allocation_records(campaign_rec.id);
      batch_count := batch_count + 1;
      
      -- Commit every 10 campaigns
      IF batch_count % 10 = 0 THEN
        RAISE NOTICE 'Processed % campaigns', batch_count;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error processing campaign %: %', campaign_rec.id, SQLERRM;
        CONTINUE;
    END;
  END LOOP;
  
  RAISE NOTICE 'Completed processing % campaigns', batch_count;
END;
$$;