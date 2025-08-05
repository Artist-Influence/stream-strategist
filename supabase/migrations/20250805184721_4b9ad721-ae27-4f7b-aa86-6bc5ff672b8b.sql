-- Remove manual max_daily_streams from vendors (will be auto-calculated)
ALTER TABLE vendors DROP COLUMN IF EXISTS max_daily_streams;

-- Add missing campaign fields
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS track_name TEXT,
  ADD COLUMN IF NOT EXISTS delivered_streams INTEGER DEFAULT 0;

-- Update remaining_streams to be calculated field
UPDATE campaigns SET remaining_streams = stream_goal - COALESCE(delivered_streams, 0);

-- Create performance_entries table for tracking playlist performance
CREATE TABLE IF NOT EXISTS performance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  daily_streams INTEGER NOT NULL,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on performance_entries
ALTER TABLE performance_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for performance_entries
CREATE POLICY "Allow all operations on performance_entries" 
ON performance_entries 
FOR ALL 
USING (true) 
WITH CHECK (true);