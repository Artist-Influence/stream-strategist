-- Create clients table with email management
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emails TEXT[] DEFAULT '{}' CHECK (array_length(emails, 1) <= 5),
  contact_person TEXT,
  phone TEXT,
  notes TEXT,
  credit_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client credits table for transaction tracking
CREATE TABLE public.client_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for credits added, negative for used
  reason TEXT,
  campaign_id UUID REFERENCES public.campaigns(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add client_id to campaigns table
ALTER TABLE public.campaigns ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Enable RLS on new tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_credits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT USING (true);

CREATE POLICY "Only admin/manager can insert clients" ON public.clients
  FOR INSERT WITH CHECK (is_vendor_manager());

CREATE POLICY "Only admin/manager can update clients" ON public.clients
  FOR UPDATE USING (is_vendor_manager());

CREATE POLICY "Only admin/manager can delete clients" ON public.clients
  FOR DELETE USING (is_vendor_manager());

-- Create RLS policies for client_credits table
CREATE POLICY "Authenticated users can view client credits" ON public.client_credits
  FOR SELECT USING (true);

CREATE POLICY "Only admin/manager can manage client credits" ON public.client_credits
  FOR ALL USING (is_vendor_manager());

-- Create triggers for updated_at columns
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing campaign client data to clients table
DO $$
DECLARE
  campaign_record RECORD;
  client_id UUID;
BEGIN
  -- Get all unique client names from campaigns
  FOR campaign_record IN 
    SELECT DISTINCT client, client_name 
    FROM public.campaigns 
    WHERE client != '' OR client_name != ''
  LOOP
    -- Use client_name if available, otherwise use client
    DECLARE
      client_name_to_use TEXT := COALESCE(NULLIF(campaign_record.client_name, ''), campaign_record.client);
    BEGIN
      -- Insert client if it doesn't exist
      INSERT INTO public.clients (name, credit_balance)
      VALUES (client_name_to_use, 0)
      ON CONFLICT (name) DO NOTHING
      RETURNING id INTO client_id;
      
      -- If no id returned, get the existing client id
      IF client_id IS NULL THEN
        SELECT id INTO client_id FROM public.clients WHERE name = client_name_to_use;
      END IF;
      
      -- Update campaigns to reference the client
      UPDATE public.campaigns 
      SET client_id = client_id
      WHERE (client = campaign_record.client OR client_name = campaign_record.client_name)
        AND client_id IS NULL;
    END;
  END LOOP;
END $$;