
-- Add missing columns to contact_persons
ALTER TABLE public.contact_persons ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
ALTER TABLE public.contact_persons ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Ensure RLS is enabled
ALTER TABLE public.contact_persons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (ignore errors)
DROP POLICY IF EXISTS "Public can read contact persons" ON public.contact_persons;
DROP POLICY IF EXISTS "Employers manage own contact persons" ON public.contact_persons;
DROP POLICY IF EXISTS "Admins manage all contact persons" ON public.contact_persons;

-- Recreate policies
CREATE POLICY "Public can read contact persons"
  ON public.contact_persons FOR SELECT
  USING (true);

CREATE POLICY "Employers manage own contact persons"
  ON public.contact_persons FOR ALL
  USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage all contact persons"
  ON public.contact_persons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_contact_persons_company_id ON public.contact_persons(company_id);
