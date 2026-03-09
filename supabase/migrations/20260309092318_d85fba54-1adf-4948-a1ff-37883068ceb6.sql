
-- Allow candidates to update their own applications (for withdrawing)
CREATE POLICY "Candidates can update own applications"
ON public.applications FOR UPDATE
TO authenticated
USING (applicant_id = auth.uid())
WITH CHECK (applicant_id = auth.uid());
