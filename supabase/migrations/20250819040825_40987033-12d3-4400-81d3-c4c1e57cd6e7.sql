-- Assign admin role to existing user
INSERT INTO public.user_roles (user_id, role)
SELECT 'f6c1a75a-1c3c-43a8-9c69-d35dc5f11dc4'::uuid, 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'f6c1a75a-1c3c-43a8-9c69-d35dc5f11dc4'::uuid 
  AND role = 'admin'::app_role
);

-- Create function to auto-assign manager role to @artistinfluence.com users
CREATE OR REPLACE FUNCTION public.handle_new_artistinfluence_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if email ends with @artistinfluence.com
  IF NEW.email LIKE '%@artistinfluence.com' THEN
    -- Insert manager role for the new user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'manager'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign manager role for @artistinfluence.com users
CREATE TRIGGER on_artistinfluence_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_artistinfluence_user();

-- Update campaigns RLS policies for shared access among all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view campaign data" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaign data" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaign data" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaign data" ON public.campaigns;

-- Create new policies for shared campaign access
CREATE POLICY "All authenticated users can view campaigns"
ON public.campaigns
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can insert campaigns"
ON public.campaigns
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "All authenticated users can update campaigns"
ON public.campaigns
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "All authenticated users can delete campaigns"
ON public.campaigns
FOR DELETE
TO authenticated
USING (true);