-- Add performance indexes for campaign_submissions table
CREATE INDEX IF NOT EXISTS idx_campaign_submissions_status_created_at 
ON campaign_submissions(status, created_at DESC);

-- Add index for faster client lookups  
CREATE INDEX IF NOT EXISTS idx_clients_name_lower 
ON clients(lower(name));

-- Add index for playlist queries
CREATE INDEX IF NOT EXISTS idx_playlists_vendor_genres 
ON playlists(vendor_id, genres);

-- Add composite index for performance entries
CREATE INDEX IF NOT EXISTS idx_performance_entries_playlist_date 
ON performance_entries(playlist_id, date_recorded DESC);