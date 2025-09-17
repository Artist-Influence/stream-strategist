-- Add external streaming data columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN radio_streams integer DEFAULT 0,
ADD COLUMN discover_weekly_streams integer DEFAULT 0,
ADD COLUMN external_streaming_data jsonb DEFAULT '{}'::jsonb;