
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT DEFAULT 'Hiring Manager',
  company TEXT NOT NULL DEFAULT '',
  role_title TEXT NOT NULL DEFAULT '',
  jd_link TEXT DEFAULT '',
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  source TEXT DEFAULT '',
  job_type TEXT DEFAULT 'CDI',
  contact_name TEXT DEFAULT '',
  contact_role TEXT DEFAULT '',
  contact_linkedin TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  linkedin_message TEXT DEFAULT '',
  connection_sent_date DATE,
  applied_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Submitted',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications" ON public.job_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON public.job_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON public.job_applications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" ON public.job_applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
