-- Allow employers to update application status for their own jobs
CREATE POLICY "Employers can update own applications"
ON public.applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id
    AND jobs.company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id
    AND jobs.company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  )
);