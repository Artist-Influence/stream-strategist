-- Add salesperson and vendor roles to jared@artistinfluence.com
INSERT INTO public.user_roles (user_id, role) 
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'jared@artistinfluence.com'), 'salesperson'),
  ((SELECT id FROM auth.users WHERE email = 'jared@artistinfluence.com'), 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;