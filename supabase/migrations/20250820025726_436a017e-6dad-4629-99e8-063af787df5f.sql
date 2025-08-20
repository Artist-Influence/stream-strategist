-- Add duration_days field to campaign_submissions table
ALTER TABLE public.campaign_submissions
ADD COLUMN duration_days integer DEFAULT 90;