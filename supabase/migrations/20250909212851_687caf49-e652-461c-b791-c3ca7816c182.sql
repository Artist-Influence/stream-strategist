-- Add new campaign status values for enhanced workflow
-- Current: draft, active, completed 
-- Adding: operator_review_complete, built, unreleased

-- First, check if we need to update the status check constraint or add new values
-- This will allow the new status values while keeping existing ones
ALTER TABLE campaigns 
DROP CONSTRAINT IF EXISTS campaigns_status_check;

-- Add the new status constraint with all possible values
ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_status_check 
CHECK (status IN ('draft', 'operator_review_complete', 'built', 'unreleased', 'active', 'paused', 'completed', 'cancelled'));

-- Add a function to help with status transitions
CREATE OR REPLACE FUNCTION public.get_next_campaign_status(current_status text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  CASE current_status
    WHEN 'draft' THEN RETURN 'operator_review_complete';
    WHEN 'operator_review_complete' THEN RETURN 'built';
    WHEN 'built' THEN RETURN 'active'; -- or 'unreleased' based on user choice
    WHEN 'unreleased' THEN RETURN 'active';
    ELSE RETURN current_status;
  END CASE;
END;
$$;