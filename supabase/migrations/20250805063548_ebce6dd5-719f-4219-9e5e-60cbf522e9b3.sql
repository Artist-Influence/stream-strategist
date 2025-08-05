-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_daily_streams INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  avg_daily_streams INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update campaigns table to match new schema
ALTER TABLE public.campaigns 
DROP COLUMN IF EXISTS brand_name,
DROP COLUMN IF EXISTS music_genres,
DROP COLUMN IF EXISTS content_types,
DROP COLUMN IF EXISTS territory_preferences,
DROP COLUMN IF EXISTS post_types,
DROP COLUMN IF EXISTS creator_count;

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS client TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS track_url TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS stream_goal INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_streams INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sub_genre TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 90,
ADD COLUMN IF NOT EXISTS selected_playlists JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS vendor_allocations JSONB NOT NULL DEFAULT '{}';

-- Create weekly_updates table
CREATE TABLE public.weekly_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  imported_on DATE NOT NULL DEFAULT CURRENT_DATE,
  streams INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your auth requirements)
CREATE POLICY "Allow all operations on vendors" 
ON public.vendors 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on playlists" 
ON public.playlists 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on weekly_updates" 
ON public.weekly_updates 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_playlists_vendor_id ON public.playlists(vendor_id);
CREATE INDEX idx_playlists_genres ON public.playlists USING GIN(genres);
CREATE INDEX idx_weekly_updates_campaign_id ON public.weekly_updates(campaign_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);

-- Create triggers for updated_at columns
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();