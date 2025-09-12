-- Create report schedules table for automated reporting
CREATE TABLE public.report_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  client_id UUID REFERENCES clients(id),
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  recipients TEXT[] NOT NULL DEFAULT '{}',
  template_settings JSONB DEFAULT '{}',
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report exports table for tracking exports
CREATE TABLE public.report_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  client_id UUID REFERENCES clients(id),
  report_type TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv')),
  file_url TEXT,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance alerts table for monitoring
CREATE TABLE public.performance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  alert_type TEXT NOT NULL,
  threshold_value NUMERIC,
  current_value NUMERIC,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dashboard configs table for custom dashboards
CREATE TABLE public.dashboard_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client report settings table
CREATE TABLE public.client_report_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) UNIQUE,
  branding_settings JSONB DEFAULT '{}',
  default_template TEXT DEFAULT 'standard',
  preferred_format TEXT DEFAULT 'pdf',
  include_predictions BOOLEAN DEFAULT true,
  include_benchmarks BOOLEAN DEFAULT true,
  custom_kpis JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_report_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin/manager can manage report schedules"
ON public.report_schedules
FOR ALL
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can manage report exports"
ON public.report_exports
FOR ALL
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

CREATE POLICY "Admin/manager can manage performance alerts"
ON public.performance_alerts
FOR ALL
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

CREATE POLICY "Users can manage their own dashboard configs"
ON public.dashboard_configs
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin/manager can view shared dashboards"
ON public.dashboard_configs
FOR SELECT
USING (is_shared = true AND is_vendor_manager());

CREATE POLICY "Admin/manager can manage client report settings"
ON public.client_report_settings
FOR ALL
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

-- Create triggers for updated_at
CREATE TRIGGER update_report_schedules_updated_at
BEFORE UPDATE ON public.report_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_configs_updated_at
BEFORE UPDATE ON public.dashboard_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_report_settings_updated_at
BEFORE UPDATE ON public.client_report_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();