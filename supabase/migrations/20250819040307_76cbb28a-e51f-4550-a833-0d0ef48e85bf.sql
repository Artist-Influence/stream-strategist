-- Fix remaining function search path issue
CREATE OR REPLACE FUNCTION public.get_spotify_token()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Get the Spotify access token from secrets
  SELECT decrypted_secret INTO token 
  FROM vault.decrypted_secrets 
  WHERE name = 'SPOTIFY_ACCESS_TOKEN';
  
  IF token IS NULL THEN
    RAISE EXCEPTION 'Spotify access token not found';
  END IF;
  
  RETURN json_build_object('token', token);
END;
$$;