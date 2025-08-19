-- Add is_active column to vendors table to allow marking vendors as inactive
-- This enables filtering out inactive vendors from AI recommendations while preserving data

ALTER TABLE public.vendors 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Add index for better performance when filtering by active status
CREATE INDEX idx_vendors_is_active ON public.vendors(is_active);

-- Add comment for clarity
COMMENT ON COLUMN public.vendors.is_active IS 'Whether the vendor is active and should be included in AI recommendations and new campaigns';