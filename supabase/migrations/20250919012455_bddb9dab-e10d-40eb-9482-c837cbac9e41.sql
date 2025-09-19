-- Add payment tracking fields to campaign_allocations_performance table
ALTER TABLE public.campaign_allocations_performance 
ADD COLUMN paid_amount numeric,
ADD COLUMN paid_date timestamp with time zone,
ADD COLUMN payment_method text,
ADD COLUMN payment_reference text,
ADD COLUMN payment_status text DEFAULT 'unpaid';