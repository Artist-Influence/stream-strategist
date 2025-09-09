-- Add new enum values (needs separate transaction)
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'salesperson';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Create vendor_users table
CREATE TABLE IF NOT EXISTS public.vendor_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;

-- Remove all public access policies
DROP POLICY IF EXISTS "Public access to campaigns via token" ON public.campaigns;
DROP POLICY IF EXISTS "Public access to campaign posts via token" ON public.campaign_posts;
DROP POLICY IF EXISTS "Public access to campaign creator basic info via token" ON public.campaign_creators;  
DROP POLICY IF EXISTS "Public access to post analytics via token" ON public.post_analytics;