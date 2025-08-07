-- Add source field to campaigns table to segment different tools
ALTER TABLE public.campaigns 
ADD COLUMN source text NOT NULL DEFAULT 'campaign_manager';

-- Add index for better performance when filtering by source
CREATE INDEX idx_campaigns_source ON public.campaigns(source);

-- Update existing campaigns to have the campaign_manager source
UPDATE public.campaigns 
SET source = 'campaign_manager' 
WHERE source = 'campaign_manager';