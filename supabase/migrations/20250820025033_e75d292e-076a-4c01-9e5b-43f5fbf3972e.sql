-- Add missing SELECT policy for clients table so users can view client data
CREATE POLICY "Admin/manager can view clients" 
ON public.clients 
FOR SELECT 
USING (is_vendor_manager());