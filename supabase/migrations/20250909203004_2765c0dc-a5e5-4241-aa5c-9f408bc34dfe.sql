-- Insert mock campaign vendor requests with proper JSON formatting
INSERT INTO campaign_vendor_requests (
  campaign_id, 
  vendor_id, 
  playlist_ids, 
  status,
  response_notes,
  requested_at
)
SELECT 
  c.id,
  v.id,
  CASE 
    WHEN p.id IS NOT NULL THEN json_build_array(p.id)::jsonb
    ELSE '[]'::jsonb
  END,
  CASE 
    WHEN row_number() OVER (ORDER BY c.created_at) = 1 THEN 'pending'
    WHEN row_number() OVER (ORDER BY c.created_at) = 2 THEN 'approved' 
    ELSE 'rejected'
  END,
  CASE 
    WHEN row_number() OVER (ORDER BY c.created_at) = 2 THEN 'Great track, perfect for our audience!'
    WHEN row_number() OVER (ORDER BY c.created_at) = 3 THEN 'Does not fit our playlist style'
    ELSE NULL
  END,
  now() - interval '1 day' * row_number() OVER (ORDER BY c.created_at)
FROM campaigns c
CROSS JOIN vendors v
LEFT JOIN playlists p ON p.vendor_id = v.id
WHERE v.name = 'Club Restricted'
  AND c.campaign_type = 'instagram'
LIMIT 5
ON CONFLICT (campaign_id, vendor_id) DO NOTHING;