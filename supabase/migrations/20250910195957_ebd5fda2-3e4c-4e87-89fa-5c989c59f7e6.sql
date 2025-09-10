-- Fix search_path security issue for the functions I created
CREATE OR REPLACE FUNCTION public.get_campaign_invoice_status(campaign_uuid uuid)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoice_status TEXT;
BEGIN
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 'not_invoiced'
      WHEN COUNT(*) FILTER (WHERE status = 'paid') = COUNT(*) THEN 'paid'
      WHEN COUNT(*) FILTER (WHERE status = 'overdue') > 0 THEN 'overdue'
      WHEN COUNT(*) FILTER (WHERE status = 'sent') > 0 THEN 'sent'
      ELSE 'pending'
    END
  INTO invoice_status
  FROM public.campaign_invoices
  WHERE campaign_id = campaign_uuid;
  
  RETURN COALESCE(invoice_status, 'not_invoiced');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_campaign_performance_status(
  current_streams integer,
  stream_goal integer,
  start_date date,
  duration_days integer
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_elapsed INTEGER;
  expected_progress NUMERIC;
  actual_progress NUMERIC;
BEGIN
  -- Calculate days elapsed since start
  days_elapsed := EXTRACT(DAY FROM (CURRENT_DATE - start_date));
  
  -- If campaign hasn't started yet
  IF days_elapsed <= 0 THEN
    RETURN 'pending';
  END IF;
  
  -- If campaign is over
  IF days_elapsed >= duration_days THEN
    IF current_streams >= stream_goal THEN
      RETURN 'completed';
    ELSE
      RETURN 'underperformed';
    END IF;
  END IF;
  
  -- Calculate expected vs actual progress
  expected_progress := (days_elapsed::NUMERIC / duration_days::NUMERIC);
  actual_progress := CASE 
    WHEN stream_goal > 0 THEN (current_streams::NUMERIC / stream_goal::NUMERIC)
    ELSE 0
  END;
  
  -- Determine performance status
  IF actual_progress >= expected_progress * 1.1 THEN
    RETURN 'exceeding';
  ELSIF actual_progress >= expected_progress * 0.8 THEN
    RETURN 'on_track';
  ELSE
    RETURN 'behind';
  END IF;
END;
$$;