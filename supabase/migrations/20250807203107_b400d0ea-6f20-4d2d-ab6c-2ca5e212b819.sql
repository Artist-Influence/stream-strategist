-- Function to calculate average daily streams for a playlist
CREATE OR REPLACE FUNCTION public.update_playlist_avg_streams(playlist_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.playlists 
  SET avg_daily_streams = (
    SELECT COALESCE(AVG(daily_streams), 0)::integer
    FROM public.performance_entries 
    WHERE playlist_id = playlist_uuid
  )
  WHERE id = playlist_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically update playlist averages
CREATE OR REPLACE FUNCTION public.trigger_update_playlist_avg()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.playlist_id IS NOT NULL THEN
      PERFORM public.update_playlist_avg_streams(NEW.playlist_id);
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.playlist_id IS NOT NULL THEN
      PERFORM public.update_playlist_avg_streams(OLD.playlist_id);
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on performance_entries table
CREATE TRIGGER trigger_performance_entries_avg_update
  AFTER INSERT OR UPDATE OR DELETE ON public.performance_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_playlist_avg();