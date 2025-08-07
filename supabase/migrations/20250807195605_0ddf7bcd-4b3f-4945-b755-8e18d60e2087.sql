-- Add max_concurrent_campaigns field to vendors table
ALTER TABLE public.vendors 
ADD COLUMN max_concurrent_campaigns INTEGER NOT NULL DEFAULT 5;

-- Add comment to explain the field
COMMENT ON COLUMN public.vendors.max_concurrent_campaigns IS 'Maximum number of concurrent active campaigns this vendor can handle';