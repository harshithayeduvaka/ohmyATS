-- Remove targeted_companies feature
DROP TABLE IF EXISTS public.targeted_companies CASCADE;

-- Job alerts: companies whose career page we monitor
CREATE TABLE public.job_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  careers_url TEXT NOT NULL,
  keywords TEXT DEFAULT '',
  last_checked_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own job_alerts" ON public.job_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own job_alerts" ON public.job_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own job_alerts" ON public.job_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own job_alerts" ON public.job_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications: discovered jobs
CREATE TABLE public.job_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID NOT NULL REFERENCES public.job_alerts(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT NOT NULL,
  location TEXT DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(alert_id, job_url)
);
ALTER TABLE public.job_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own job_notifications" ON public.job_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own job_notifications" ON public.job_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own job_notifications" ON public.job_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own job_notifications" ON public.job_notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_job_alerts_updated BEFORE UPDATE ON public.job_alerts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();