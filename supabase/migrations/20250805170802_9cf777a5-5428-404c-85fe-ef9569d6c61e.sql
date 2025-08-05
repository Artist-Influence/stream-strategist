-- Add missing columns to existing tables
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cost_per_1k_streams DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS track_name TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS allocated_streams INTEGER DEFAULT 0;

-- Update campaigns table to support multi-genre selection by changing sub_genre to sub_genres array
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sub_genres TEXT[] DEFAULT '{}';

-- Create new table for performance tracking
CREATE TABLE IF NOT EXISTS performance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  daily_streams INTEGER NOT NULL,
  date_recorded DATE DEFAULT CURRENT_DATE,
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

-- Add trigger for performance_entries updated_at
CREATE TRIGGER update_performance_entries_updated_at
  BEFORE UPDATE ON performance_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();