-- Fix RLS policy for salespeople table to allow public access to active salespeople
DROP POLICY IF EXISTS "Public can view active salespeople" ON public.salespeople;
CREATE POLICY "Public can view active salespeople" 
ON public.salespeople 
FOR SELECT 
USING (is_active = true);

-- Add sample email data to existing clients for testing
UPDATE public.clients 
SET emails = ARRAY['contact@client1.com', 'manager@client1.com']
WHERE name = 'Acme Corp' AND emails = '{}';

UPDATE public.clients 
SET emails = ARRAY['info@techstartup.com']
WHERE name = 'Tech Startup Inc' AND emails = '{}';

UPDATE public.clients 
SET emails = ARRAY['marketing@musiclabel.com', 'a&r@musiclabel.com']
WHERE name = 'Music Label LLC' AND emails = '{}';