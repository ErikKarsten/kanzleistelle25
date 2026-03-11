
-- Recommendations table for the matching workflow
CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  applicant_user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  admin_note text,
  applicant_name text,
  company_name text,
  job_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  resulting_application_id uuid
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage recommendations" ON public.recommendations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Candidates can see their own recommendations
CREATE POLICY "Candidates view own recommendations" ON public.recommendations
  FOR SELECT TO authenticated
  USING (applicant_user_id = auth.uid());

-- Candidates can update own recommendations (accept/reject)
CREATE POLICY "Candidates update own recommendations" ON public.recommendations
  FOR UPDATE TO authenticated
  USING (applicant_user_id = auth.uid())
  WITH CHECK (applicant_user_id = auth.uid());
