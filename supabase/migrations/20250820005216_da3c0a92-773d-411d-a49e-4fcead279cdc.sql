-- Enhanced Performance Tracking Schema
-- This implements Phase 1 of the optimization plan

-- Track actual vs predicted performance for each campaign allocation
CREATE TABLE public.campaign_allocations_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  playlist_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  allocated_streams INTEGER NOT NULL,
  predicted_streams INTEGER NOT NULL,
  actual_streams INTEGER DEFAULT 0,
  cost_per_stream NUMERIC(10,4),
  actual_cost_per_stream NUMERIC(10,4),
  performance_score NUMERIC(5,2) DEFAULT 0, -- actual/predicted ratio
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Playlist performance history with trend tracking
CREATE TABLE public.playlist_performance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL,
  campaign_id UUID,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  avg_daily_streams INTEGER NOT NULL DEFAULT 0,
  peak_streams INTEGER DEFAULT 0,
  genre_match_score NUMERIC(5,2) DEFAULT 0,
  performance_trend TEXT DEFAULT 'stable', -- 'improving', 'declining', 'stable'
  reliability_score NUMERIC(5,2) DEFAULT 1.0, -- 0-1 score based on consistency
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor reliability and performance scoring
CREATE TABLE public.vendor_reliability_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  delivery_consistency NUMERIC(5,2) DEFAULT 1.0, -- 0-1 score
  stream_accuracy NUMERIC(5,2) DEFAULT 1.0, -- predicted vs actual accuracy
  cost_efficiency NUMERIC(5,2) DEFAULT 1.0, -- cost per stream efficiency
  response_time_hours INTEGER DEFAULT 24,
  quality_score NUMERIC(5,2) DEFAULT 1.0,
  total_campaigns INTEGER DEFAULT 0,
  successful_campaigns INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dynamic genre correlation matrix for learning
CREATE TABLE public.genre_correlation_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  genre_a TEXT NOT NULL,
  genre_b TEXT NOT NULL,
  correlation_score NUMERIC(5,4) DEFAULT 0, -- -1 to 1
  sample_size INTEGER DEFAULT 0,
  success_rate NUMERIC(5,4) DEFAULT 0,
  avg_performance_lift NUMERIC(5,4) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(genre_a, genre_b)
);

-- Algorithm learning and decision log
CREATE TABLE public.algorithm_learning_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID,
  algorithm_version TEXT DEFAULT '2.0',
  decision_type TEXT NOT NULL, -- 'allocation', 'rebalancing', 'learning_update'
  input_data JSONB,
  decision_data JSONB,
  performance_impact NUMERIC(5,4),
  confidence_score NUMERIC(5,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.campaign_allocations_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_reliability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genre_correlation_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.algorithm_learning_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin/manager access
CREATE POLICY "Admin/manager can manage campaign allocations performance" 
ON public.campaign_allocations_performance FOR ALL 
USING (is_vendor_manager()) 
WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can manage playlist performance history" 
ON public.playlist_performance_history FOR ALL 
USING (is_vendor_manager()) 
WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can manage vendor reliability scores" 
ON public.vendor_reliability_scores FOR ALL 
USING (is_vendor_manager()) 
WITH CHECK (is_vendor_manager());

CREATE POLICY "Anyone can view genre correlations" 
ON public.genre_correlation_matrix FOR SELECT 
USING (true);

CREATE POLICY "Admin/manager can manage genre correlations" 
ON public.genre_correlation_matrix FOR INSERT, UPDATE, DELETE 
USING (is_vendor_manager()) 
WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can manage algorithm learning log" 
ON public.algorithm_learning_log FOR ALL 
USING (is_vendor_manager()) 
WITH CHECK (is_vendor_manager());

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_campaign_allocations_performance_updated_at
BEFORE UPDATE ON public.campaign_allocations_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update playlist reliability based on performance
CREATE OR REPLACE FUNCTION public.update_playlist_reliability_score(playlist_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate reliability based on recent performance consistency
  UPDATE public.playlists 
  SET updated_at = now()
  WHERE id = playlist_uuid;
  
  -- Insert or update performance history
  INSERT INTO public.playlist_performance_history (
    playlist_id,
    period_start,
    period_end,
    avg_daily_streams,
    reliability_score
  )
  SELECT 
    playlist_uuid,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    COALESCE(AVG(daily_streams), 0)::integer,
    CASE 
      WHEN COUNT(*) >= 5 THEN 
        1.0 - (STDDEV(daily_streams) / NULLIF(AVG(daily_streams), 0))
      ELSE 0.5 
    END
  FROM public.performance_entries 
  WHERE playlist_id = playlist_uuid 
    AND date_recorded >= CURRENT_DATE - INTERVAL '30 days'
  ON CONFLICT DO NOTHING;
END;
$$;

-- Function to update vendor reliability scores
CREATE OR REPLACE FUNCTION public.update_vendor_reliability_scores()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update vendor reliability based on campaign performance
  INSERT INTO public.vendor_reliability_scores (
    vendor_id,
    delivery_consistency,
    stream_accuracy,
    total_campaigns,
    successful_campaigns
  )
  SELECT 
    v.id,
    COALESCE(AVG(
      CASE WHEN cap.actual_streams >= cap.predicted_streams * 0.8 
           THEN 1.0 
           ELSE cap.actual_streams::numeric / NULLIF(cap.predicted_streams, 0) 
      END
    ), 1.0) as delivery_consistency,
    COALESCE(1.0 - AVG(ABS(
      cap.actual_streams::numeric - cap.predicted_streams::numeric
    ) / NULLIF(cap.predicted_streams, 0)), 1.0) as stream_accuracy,
    COUNT(DISTINCT cap.campaign_id) as total_campaigns,
    COUNT(DISTINCT CASE WHEN cap.performance_score >= 0.8 THEN cap.campaign_id END) as successful_campaigns
  FROM public.vendors v
  LEFT JOIN public.campaign_allocations_performance cap ON v.id = cap.vendor_id
  WHERE v.is_active = true
  GROUP BY v.id
  ON CONFLICT (vendor_id) DO UPDATE SET
    delivery_consistency = EXCLUDED.delivery_consistency,
    stream_accuracy = EXCLUDED.stream_accuracy,
    total_campaigns = EXCLUDED.total_campaigns,
    successful_campaigns = EXCLUDED.successful_campaigns,
    last_updated = now();
END;
$$;