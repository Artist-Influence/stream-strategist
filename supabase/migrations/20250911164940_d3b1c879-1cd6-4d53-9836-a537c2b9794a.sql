-- Create mockup playlist for Club Restricted vendor
INSERT INTO playlists (id, vendor_id, name, url, genres, avg_daily_streams, follower_count)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'cd243c1c-f149-474b-8b26-3d683d1826f4',
  '200/2010 white girl', 
  'https://open.spotify.com/playlist/mock-200-2010',
  ARRAY['pop', 'indie', 'alternative'],
  1500,
  2800
);

-- Create campaign vendor request for Claudia Valentina campaign
INSERT INTO campaign_vendor_requests (campaign_id, vendor_id, playlist_ids, status, response_notes)
VALUES (
  'c72df5a2-a621-4d5d-89b5-2681ad6c63ec',
  'cd243c1c-f149-474b-8b26-3d683d1826f4', 
  '["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]'::jsonb,
  'pending',
  NULL
);