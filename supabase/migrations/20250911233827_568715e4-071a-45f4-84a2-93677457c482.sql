-- Add vendor-friendly SELECT policies to fix visibility for vendors like "Club Restricted"
-- 1) Allow vendors to view campaigns that have requests addressed to them
CREATE POLICY IF NOT EXISTS "Vendors can view campaigns with requests"
ON public.campaigns
FOR SELECT
USING (
  public.is_vendor() AND EXISTS (
    SELECT 1
    FROM public.campaign_vendor_requests r
    JOIN public.vendor_users vu ON vu.vendor_id = r.vendor_id
    WHERE r.campaign_id = campaigns.id
      AND vu.user_id = auth.uid()
  )
);

-- 2) Allow vendors to view campaigns when selected_playlists contains their playlists,
--    supporting both string IDs and object formats { id: ..., playlist_id: ... }
CREATE POLICY IF NOT EXISTS "Vendors can view campaigns via object playlist ids"
ON public.campaigns
FOR SELECT
USING (
  public.is_vendor() AND EXISTS (
    SELECT 1
    FROM public.vendor_users vu
    JOIN public.playlists p ON p.vendor_id = vu.vendor_id
    CROSS JOIN LATERAL jsonb_array_elements(campaigns.selected_playlists) AS elem
    WHERE vu.user_id = auth.uid()
      AND (
        (jsonb_typeof(elem) = 'string' AND p.id::text = trim(both '"' from elem::text))
        OR (jsonb_typeof(elem) = 'object' AND (p.id::text = elem->>'id' OR p.id::text = elem->>'playlist_id'))
      )
  )
);

-- 3) Allow vendors to view campaigns that explicitly allocate to them via vendor_allocations JSON
CREATE POLICY IF NOT EXISTS "Vendors can view campaigns via vendor_allocations"
ON public.campaigns
FOR SELECT
USING (
  public.is_vendor() AND EXISTS (
    SELECT 1
    FROM public.vendor_users vu
    WHERE vu.user_id = auth.uid()
      AND (campaigns.vendor_allocations ? vu.vendor_id::text)
  )
);
