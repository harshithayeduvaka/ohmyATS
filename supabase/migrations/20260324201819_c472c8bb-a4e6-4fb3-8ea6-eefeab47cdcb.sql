
CREATE TABLE public.company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company text NOT NULL DEFAULT '',
  industry text DEFAULT '',
  website text DEFAULT '',
  ceo_name text DEFAULT '',
  ceo_email text DEFAULT '',
  ceo_linkedin text DEFAULT '',
  marketing_head_name text DEFAULT '',
  marketing_head_email text DEFAULT '',
  marketing_head_linkedin text DEFAULT '',
  hr_head_name text DEFAULT '',
  hr_head_email text DEFAULT '',
  hr_head_linkedin text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" ON public.company_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contacts" ON public.company_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON public.company_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON public.company_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);
