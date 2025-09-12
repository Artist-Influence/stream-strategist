-- Create payment_history table to track all payment transactions
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'manual',
  reference_number TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin/manager can manage payment history" 
ON public.payment_history 
FOR ALL 
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

CREATE POLICY "Vendors can view their own payment history" 
ON public.payment_history 
FOR SELECT 
USING (is_vendor() AND EXISTS (
  SELECT 1 FROM vendor_users 
  WHERE vendor_users.user_id = auth.uid() 
  AND vendor_users.vendor_id = payment_history.vendor_id
));

-- Create sales_goals table for individual salesperson targets
CREATE TABLE public.sales_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesperson_email TEXT NOT NULL,
  goal_period_start DATE NOT NULL,
  goal_period_end DATE NOT NULL,
  revenue_target NUMERIC NOT NULL DEFAULT 0,
  campaigns_target INTEGER NOT NULL DEFAULT 0,
  commission_target NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin/manager can manage sales goals" 
ON public.sales_goals 
FOR ALL 
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

CREATE POLICY "Salespeople can view their own goals" 
ON public.sales_goals 
FOR SELECT 
USING (is_salesperson() AND salesperson_email = get_current_user_email());

-- Create team_goals table for team-wide targets
CREATE TABLE public.team_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_name TEXT NOT NULL,
  goal_period_start DATE NOT NULL,
  goal_period_end DATE NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  goal_type TEXT NOT NULL, -- 'revenue', 'campaigns', 'clients', etc.
  created_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin/manager can manage team goals" 
ON public.team_goals 
FOR ALL 
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

CREATE POLICY "Salespeople can view team goals" 
ON public.team_goals 
FOR SELECT 
USING (is_salesperson() OR is_vendor_manager());

-- Create sales_performance_tracking table for automated tracking
CREATE TABLE public.sales_performance_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesperson_email TEXT NOT NULL,
  tracking_period_start DATE NOT NULL,
  tracking_period_end DATE NOT NULL,
  actual_revenue NUMERIC NOT NULL DEFAULT 0,
  actual_campaigns INTEGER NOT NULL DEFAULT 0,
  actual_commission NUMERIC NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(salesperson_email, tracking_period_start, tracking_period_end)
);

-- Enable RLS
ALTER TABLE public.sales_performance_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin/manager can manage sales performance tracking" 
ON public.sales_performance_tracking 
FOR ALL 
USING (is_vendor_manager())
WITH CHECK (is_vendor_manager());

CREATE POLICY "Salespeople can view their own performance tracking" 
ON public.sales_performance_tracking 
FOR SELECT 
USING (is_salesperson() AND salesperson_email = get_current_user_email());

-- Add triggers for updated_at columns
CREATE TRIGGER update_payment_history_updated_at
BEFORE UPDATE ON public.payment_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_goals_updated_at
BEFORE UPDATE ON public.sales_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_goals_updated_at
BEFORE UPDATE ON public.team_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_performance_tracking_updated_at
BEFORE UPDATE ON public.sales_performance_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();