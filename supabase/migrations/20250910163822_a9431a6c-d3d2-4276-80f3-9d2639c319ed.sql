-- Make brand_name nullable to prevent null constraint errors
-- This field is not currently used in the client management system
ALTER TABLE public.campaigns 
ALTER COLUMN brand_name DROP NOT NULL;