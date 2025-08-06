-- Add updated_at trigger to campaigns table if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for campaigns table
CREATE TRIGGER update_campaigns_updated_at 
  BEFORE UPDATE ON public.campaigns 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();