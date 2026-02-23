
-- Allow employers to SELECT applications for their company's jobs
CREATE POLICY "Employers can view applications for their jobs"
ON public.applications
FOR SELECT
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.jobs
    WHERE company_id IN (
      SELECT id FROM public.companies
      WHERE user_id = auth.uid()
    )
  )
  OR
  company_id IN (
    SELECT id FROM public.companies
    WHERE user_id = auth.uid()
  )
);

-- Allow employers to UPDATE applications for their company's jobs
CREATE POLICY "Employers can update applications for their jobs"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.jobs
    WHERE company_id IN (
      SELECT id FROM public.companies
      WHERE user_id = auth.uid()
    )
  )
  OR
  company_id IN (
    SELECT id FROM public.companies
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  job_id IN (
    SELECT id FROM public.jobs
    WHERE company_id IN (
      SELECT id FROM public.companies
      WHERE user_id = auth.uid()
    )
  )
  OR
  company_id IN (
    SELECT id FROM public.companies
    WHERE user_id = auth.uid()
  )
);
