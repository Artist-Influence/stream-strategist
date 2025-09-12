-- Create content verification logs table
CREATE TABLE public.content_verification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL,
  campaign_id UUID,
  verification_type TEXT NOT NULL, -- 'genre_matching', 'content_quality', 'manual_review'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'flagged'
  score NUMERIC(3,2), -- 0.00 to 1.00
  verification_data JSONB DEFAULT '{}',
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fraud detection alerts table
CREATE TABLE public.fraud_detection_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID,
  playlist_id UUID,
  vendor_id UUID,
  alert_type TEXT NOT NULL, -- 'suspicious_streams', 'velocity_anomaly', 'pattern_irregularity', 'vendor_behavior'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  detection_data JSONB DEFAULT '{}',
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign compliance checkpoints table
CREATE TABLE public.campaign_compliance_checkpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  checkpoint_type TEXT NOT NULL, -- 'content_verified', 'fraud_checked', 'delivery_milestone', 'completion_verified'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'skipped'
  expected_date DATE,
  completed_date DATE,
  compliance_data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor compliance scoring history table
CREATE TABLE public.vendor_compliance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content_verification_score NUMERIC(3,2) DEFAULT 1.00,
  fraud_risk_score NUMERIC(3,2) DEFAULT 0.00,
  delivery_compliance_score NUMERIC(3,2) DEFAULT 1.00,
  overall_compliance_score NUMERIC(3,2) DEFAULT 1.00,
  campaigns_evaluated INTEGER DEFAULT 0,
  violations_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, period_start, period_end)
);

-- Enable RLS on all tables
ALTER TABLE public.content_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detection_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_compliance_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_compliance_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content verification logs
CREATE POLICY "Admin/manager can manage content verification logs"
ON public.content_verification_logs
FOR ALL
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Create RLS policies for fraud detection alerts
CREATE POLICY "Admin/manager can manage fraud detection alerts"
ON public.fraud_detection_alerts
FOR ALL
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Create RLS policies for campaign compliance checkpoints
CREATE POLICY "Admin/manager can manage compliance checkpoints"
ON public.campaign_compliance_checkpoints
FOR ALL
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Create RLS policies for vendor compliance scores
CREATE POLICY "Admin/manager can manage vendor compliance scores"
ON public.vendor_compliance_scores
FOR ALL
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Create triggers for updated_at columns
CREATE TRIGGER update_content_verification_logs_updated_at
BEFORE UPDATE ON public.content_verification_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fraud_detection_alerts_updated_at
BEFORE UPDATE ON public.fraud_detection_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_compliance_checkpoints_updated_at
BEFORE UPDATE ON public.campaign_compliance_checkpoints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_compliance_scores_updated_at
BEFORE UPDATE ON public.vendor_compliance_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_content_verification_logs_playlist_id ON public.content_verification_logs(playlist_id);
CREATE INDEX idx_content_verification_logs_campaign_id ON public.content_verification_logs(campaign_id);
CREATE INDEX idx_fraud_detection_alerts_campaign_id ON public.fraud_detection_alerts(campaign_id);
CREATE INDEX idx_fraud_detection_alerts_vendor_id ON public.fraud_detection_alerts(vendor_id);
CREATE INDEX idx_fraud_detection_alerts_status ON public.fraud_detection_alerts(status);
CREATE INDEX idx_campaign_compliance_checkpoints_campaign_id ON public.campaign_compliance_checkpoints(campaign_id);
CREATE INDEX idx_vendor_compliance_scores_vendor_id ON public.vendor_compliance_scores(vendor_id);