-- Fix search path security issues for the functions
ALTER FUNCTION public.update_playlist_avg_streams(UUID) SET search_path TO 'public';
ALTER FUNCTION public.trigger_update_playlist_avg() SET search_path TO 'public';