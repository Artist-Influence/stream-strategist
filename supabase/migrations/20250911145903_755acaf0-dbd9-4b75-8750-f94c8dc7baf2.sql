-- Add notes column to campaigns table for salesperson feedback
ALTER TABLE public.campaigns 
ADD COLUMN notes TEXT;