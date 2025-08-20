-- Fix function search path security warnings
ALTER FUNCTION public.update_playlist_reliability_score(uuid) SET search_path TO 'public';
ALTER FUNCTION public.update_vendor_reliability_scores() SET search_path TO 'public';