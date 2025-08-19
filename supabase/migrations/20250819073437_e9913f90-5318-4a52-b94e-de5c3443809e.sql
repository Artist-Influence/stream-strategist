-- Ensure the pg_net extension is available for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the trigger function to use net.http_post instead of extensions.http_post
CREATE OR REPLACE FUNCTION public.notify_campaign_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Call the Slack notification edge function using the correct pg_net schema
  PERFORM
    net.http_post(
      url := 'https://mwtrdhnctzasddbeilwm.supabase.co/functions/v1/campaign-submission-notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dHJkaG5jdHphc2RkYmVpbHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Njg2OTEsImV4cCI6MjA2OTA0NDY5MX0.KpfR54ZUuhe7wZ-yf1rZny0Rk1C17MlLssB-EjOymRY'
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  
  RETURN NEW;
END;
$function$;