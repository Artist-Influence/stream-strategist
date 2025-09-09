-- Create vendor "Club Restricted" if it doesn't exist
INSERT INTO vendors (name, max_daily_streams, cost_per_1k_streams, max_concurrent_campaigns, is_active)
VALUES ('Club Restricted', 10000, 2.50, 3, true)
ON CONFLICT DO NOTHING;

-- Associate jared@artistinfluence.com with Club Restricted vendor
INSERT INTO vendor_users (user_id, vendor_id)
SELECT 
  u.id,
  v.id
FROM auth.users u
CROSS JOIN vendors v
WHERE u.email = 'jared@artistinfluence.com'
  AND v.name = 'Club Restricted'
  AND NOT EXISTS (
    SELECT 1 FROM vendor_users vu 
    WHERE vu.user_id = u.id AND vu.vendor_id = v.id
  );