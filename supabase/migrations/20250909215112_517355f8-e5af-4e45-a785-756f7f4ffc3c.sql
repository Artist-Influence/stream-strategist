-- Add submission_id to campaigns table to track source submissions
ALTER TABLE campaigns ADD COLUMN submission_id uuid REFERENCES campaign_submissions(id);

-- Add index for better query performance
CREATE INDEX idx_campaigns_submission_id ON campaigns(submission_id);

-- Add index for pending operator review campaigns
CREATE INDEX idx_campaigns_pending_operator_review ON campaigns(pending_operator_review) WHERE pending_operator_review = true;