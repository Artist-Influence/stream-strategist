-- Add genre selection and preference fields to campaign_submissions table
ALTER TABLE public.campaign_submissions 
ADD COLUMN music_genres text[] DEFAULT '{}',
ADD COLUMN territory_preferences text[] DEFAULT '{}',
ADD COLUMN content_types text[] DEFAULT '{}';

-- Update campaigns table to include draft status and algorithm data
ALTER TABLE public.campaigns 
ADD COLUMN algorithm_recommendations jsonb DEFAULT '{}',
ADD COLUMN pending_operator_review boolean DEFAULT false;