
-- Allow employers to delete applications for their company's jobs (DSGVO)
CREATE POLICY "Employers can delete applications for their jobs"
ON public.applications
FOR DELETE
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
