-- Create user roles system to control access to sensitive data
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create helper function to check if user is admin or manager
CREATE OR REPLACE FUNCTION public.is_vendor_manager()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  );
$$;

-- Drop existing vendor policies
DROP POLICY IF EXISTS "Authenticated users can view vendor data" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can insert vendor data" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can update vendor data" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can delete vendor data" ON public.vendors;

-- Create new restricted vendor policies
CREATE POLICY "Only admin/manager can view vendor data" 
ON public.vendors 
FOR SELECT 
USING (public.is_vendor_manager());

CREATE POLICY "Only admin/manager can insert vendor data" 
ON public.vendors 
FOR INSERT 
WITH CHECK (public.is_vendor_manager());

CREATE POLICY "Only admin/manager can update vendor data" 
ON public.vendors 
FOR UPDATE 
USING (public.is_vendor_manager());

CREATE POLICY "Only admin/manager can delete vendor data" 
ON public.vendors 
FOR DELETE 
USING (public.is_vendor_manager());

-- Create policy for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert a default admin role (you'll need to replace this with actual user ID)
-- This creates an admin user - replace with your actual auth.users.id
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('your-user-id-here', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;