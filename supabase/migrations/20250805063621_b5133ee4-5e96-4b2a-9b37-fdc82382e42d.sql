-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_daily_streams INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlists table  
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  avg_daily_streams INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update campaigns table (only add new columns if they don't exist)
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
CREATE TABLE IF NOT EXISTS public.weekly_updates (
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

-- Create policies for public access
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
CREATE INDEX IF NOT EXISTS idx_playlists_vendor_id ON public.playlists(vendor_id);
CREATE INDEX IF NOT EXISTS idx_playlists_genres ON public.playlists USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_weekly_updates_campaign_id ON public.weekly_updates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

-- Create triggers for updated_at columns (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_vendors_updated_at' AND event_object_table = 'vendors') THEN
    CREATE TRIGGER update_vendors_updated_at
      BEFORE UPDATE ON public.vendors
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_playlists_updated_at' AND event_object_table = 'playlists') THEN
    CREATE TRIGGER update_playlists_updated_at
      BEFORE UPDATE ON public.playlists
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;