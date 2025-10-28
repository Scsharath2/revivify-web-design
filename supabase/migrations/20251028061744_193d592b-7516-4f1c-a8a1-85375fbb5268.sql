-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'viewer');

-- Create user_roles table (CRITICAL: separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create providers table
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create models table
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(provider_id, name)
);

-- Create business_units table
CREATE TABLE public.business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  monthly_budget NUMERIC(12,2),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create api_requests table (high-scale ingestion)
CREATE TABLE public.api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES public.business_units(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.providers(id) NOT NULL,
  model_id UUID REFERENCES public.models(id) NOT NULL,
  request_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC(12,6) NOT NULL DEFAULT 0,
  response_time_ms INTEGER,
  status_code INTEGER,
  was_blocked BOOLEAN DEFAULT false NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES public.business_units(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  allocated_amount NUMERIC(12,2) NOT NULL,
  spent_amount NUMERIC(12,2) DEFAULT 0 NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create alert_configs table
CREATE TABLE public.alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  warning_threshold INTEGER NOT NULL CHECK (warning_threshold >= 0 AND warning_threshold <= 100),
  critical_threshold INTEGER NOT NULL CHECK (critical_threshold >= 0 AND critical_threshold <= 100),
  recipients TEXT[] NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create policies table (blocking/controls)
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance indexes for api_requests (high-scale queries)
CREATE INDEX idx_api_requests_timestamp ON public.api_requests(request_timestamp DESC);
CREATE INDEX idx_api_requests_provider ON public.api_requests(provider_id);
CREATE INDEX idx_api_requests_business_unit ON public.api_requests(business_unit_id);
CREATE INDEX idx_api_requests_provider_model_time ON public.api_requests(provider_id, model_id, request_timestamp DESC);

-- Index for audit logs
CREATE INDEX idx_audit_logs_user_time ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin or analyst
CREATE OR REPLACE FUNCTION public.can_manage()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'analyst')
  )
$$;

-- RLS Policies for user_roles (admin only)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for providers (all authenticated can view, admin can manage)
CREATE POLICY "All authenticated can view providers"
  ON public.providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage providers"
  ON public.providers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for models (all authenticated can view, admin can manage)
CREATE POLICY "All authenticated can view models"
  ON public.models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage models"
  ON public.models FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for business_units (all can view, admin/analyst can manage)
CREATE POLICY "All authenticated can view business units"
  ON public.business_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can manage business units"
  ON public.business_units FOR ALL
  TO authenticated
  USING (public.can_manage());

-- RLS Policies for api_requests (all can view)
CREATE POLICY "All authenticated can view api requests"
  ON public.api_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can insert api requests"
  ON public.api_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for budgets (all can view, admin/analyst can manage)
CREATE POLICY "All authenticated can view budgets"
  ON public.budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can manage budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (public.can_manage());

-- RLS Policies for alert_configs (all can view, admin/analyst can manage)
CREATE POLICY "All authenticated can view alerts"
  ON public.alert_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can manage alerts"
  ON public.alert_configs FOR ALL
  TO authenticated
  USING (public.can_manage());

-- RLS Policies for policies (all can view, admin only manages)
CREATE POLICY "All authenticated can view policies"
  ON public.policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage policies"
  ON public.policies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs (admin only)
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_business_units_updated_at
  BEFORE UPDATE ON public.business_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_alert_configs_updated_at
  BEFORE UPDATE ON public.alert_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert default providers
INSERT INTO public.providers (name, display_name) VALUES
  ('openai', 'OpenAI'),
  ('anthropic', 'Anthropic'),
  ('google', 'Google AI'),
  ('local', 'Local Models');

-- Insert default models
INSERT INTO public.models (provider_id, name, display_name)
SELECT p.id, m.name, m.display_name
FROM public.providers p
CROSS JOIN LATERAL (
  VALUES
    ('gpt-4', 'GPT-4'),
    ('gpt-3.5-turbo', 'GPT-3.5 Turbo')
) AS m(name, display_name)
WHERE p.name = 'openai'

UNION ALL

SELECT p.id, m.name, m.display_name
FROM public.providers p
CROSS JOIN LATERAL (
  VALUES
    ('claude-3-opus', 'Claude 3 Opus'),
    ('claude-3-sonnet', 'Claude 3 Sonnet')
) AS m(name, display_name)
WHERE p.name = 'anthropic'

UNION ALL

SELECT p.id, m.name, m.display_name
FROM public.providers p
CROSS JOIN LATERAL (
  VALUES
    ('gemini-pro', 'Gemini Pro'),
    ('gemini-flash', 'Gemini Flash')
) AS m(name, display_name)
WHERE p.name = 'google';

-- Create global block policy (default)
INSERT INTO public.policies (name, policy_type, is_active, config, created_by)
SELECT 
  'Global Request Block',
  'global_block',
  false,
  '{"description": "Block all incoming AI requests"}'::jsonb,
  auth.uid()
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);