-- Add some sample playlists for Club Restricted vendor for testing
INSERT INTO playlists (vendor_id, name, url, genres, avg_daily_streams, follower_count)
SELECT 
  v.id,
  'Club Vibes Mix',
  'https://open.spotify.com/playlist/3cONDyFunk4',
  ARRAY['House', 'Electronic', 'Dance'],
  2500,
  15000
FROM vendors v
WHERE v.name = 'Club Restricted'
AND NOT EXISTS (
  SELECT 1 FROM playlists p 
  WHERE p.vendor_id = v.id AND p.name = 'Club Vibes Mix'
);

INSERT INTO playlists (vendor_id, name, url, genres, avg_daily_streams, follower_count)
SELECT 
  v.id,
  'Underground Beats',
  'https://open.spotify.com/playlist/7aB3xYzCool9',
  ARRAY['Techno', 'Deep House'],
  1800,
  8500
FROM vendors v
WHERE v.name = 'Club Restricted'
AND NOT EXISTS (
  SELECT 1 FROM playlists p 
  WHERE p.vendor_id = v.id AND p.name = 'Underground Beats'
);

INSERT INTO playlists (vendor_id, name, url, genres, avg_daily_streams, follower_count)
SELECT 
  v.id,
  'Progressive House Journey',
  'https://open.spotify.com/playlist/9xC2Progress',
  ARRAY['Progressive House', 'Melodic Techno'],
  3200,
  22000
FROM vendors v
WHERE v.name = 'Club Restricted'
AND NOT EXISTS (
  SELECT 1 FROM playlists p 
  WHERE p.vendor_id = v.id AND p.name = 'Progressive House Journey'
);