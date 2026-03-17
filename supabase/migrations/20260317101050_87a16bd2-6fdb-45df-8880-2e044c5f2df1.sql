-- Replace overly permissive application insert policies with explicit checks
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.applications;
DROP POLICY IF EXISTS "allow_public_application_insert" ON public.applications;

CREATE POLICY "Public can submit applications"
ON public.applications
FOR INSERT
TO public
WITH CHECK (
  NULLIF(btrim(COALESCE(first_name, '')), '') IS NOT NULL
  AND NULLIF(btrim(COALESCE(last_name, '')), '') IS NOT NULL
  AND NULLIF(btrim(COALESCE(email, '')), '') IS NOT NULL
  AND (
    auth.uid() IS NULL
    OR (
      (user_id IS NULL AND applicant_id IS NULL)
      OR user_id = auth.uid()
      OR applicant_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

-- Replace overly permissive contact lead insert policy with explicit checks
DROP POLICY IF EXISTS "Public can insert contact leads" ON public.contact_leads;

CREATE POLICY "Public can submit contact leads"
ON public.contact_leads
FOR INSERT
TO public
WITH CHECK (
  NULLIF(btrim(COALESCE(full_name, '')), '') IS NOT NULL
  AND NULLIF(btrim(COALESCE(email, '')), '') IS NOT NULL
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NULLIF(btrim(COALESCE(message, '')), '') IS NOT NULL
);