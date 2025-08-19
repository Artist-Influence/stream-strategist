-- Create trigger on auth.users to automatically assign manager role to @artistinfluence.com users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_artistinfluence_user();

-- Backfill user_roles with 'manager' for all existing @artistinfluence.com users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'manager'::app_role
FROM auth.users 
WHERE email LIKE '%@artistinfluence.com'
AND id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'manager'::app_role);