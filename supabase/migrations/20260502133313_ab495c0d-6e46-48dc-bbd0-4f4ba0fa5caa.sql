CREATE TABLE public.targeted_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  careers_url TEXT,
  website TEXT,
  notes TEXT DEFAULT '',
  profession TEXT,
  preferred_location TEXT,
  preferred_job_type TEXT,
  preferred_keywords TEXT,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.targeted_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own targeted companies" ON public.targeted_companies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own targeted companies" ON public.targeted_companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own targeted companies" ON public.targeted_companies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own targeted companies" ON public.targeted_companies FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER targeted_companies_set_updated_at
BEFORE UPDATE ON public.targeted_companies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();