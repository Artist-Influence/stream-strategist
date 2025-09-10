-- Fix permission denied for table users error
-- Create security definer function to safely get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop and recreate the problematic RLS policy
DROP POLICY IF EXISTS "Salespersons can view their own campaigns" ON public.campaigns;

CREATE POLICY "Salespersons can view their own campaigns" 
ON public.campaigns FOR SELECT USING (
  is_salesperson() AND salesperson = public.get_current_user_email()
);