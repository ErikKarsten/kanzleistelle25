CREATE OR REPLACE FUNCTION public.link_application_to_user(_application_id uuid, _user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Backfill both IDs for all legacy applications of this email
  UPDATE public.applications
  SET
    applicant_id = COALESCE(applicant_id, _user_id),
    user_id = COALESCE(user_id, _user_id)
  WHERE email IS NOT NULL
    AND lower(email) = lower(_email)
    AND (applicant_id IS NULL OR user_id IS NULL);

  -- Ensure candidate role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'candidate')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Candidates can view own applications by email'
  ) THEN
    CREATE POLICY "Candidates can view own applications by email"
    ON public.applications
    FOR SELECT
    USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
  END IF;
END;
$$;