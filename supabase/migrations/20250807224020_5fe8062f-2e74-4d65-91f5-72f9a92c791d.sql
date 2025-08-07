-- Add missing daily_streams and weekly_streams columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS daily_streams integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_streams integer DEFAULT 0;