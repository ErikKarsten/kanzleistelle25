
-- 1. Fix link_application_to_user: create profile if missing before setting applicant_id
CREATE OR REPLACE FUNCTION public.link_application_to_user(_application_id uuid, _user_id uuid, _email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure a profile exists for this user (required by FK on applicant_id)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    _user_id,
    _email,
    (SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE id = _user_id)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Backfill user_id for all legacy applications of this email
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

-- 2. Fix messages RLS: Drop restrictive applicant INSERT policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Applicants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Chat-Beteiligte dürfen schreiben" ON public.messages;

-- Permissive: applicants can send messages if they own the application (by user_id, applicant_id, or email)
CREATE POLICY "Applicants can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_type = 'applicant'
  AND application_id IN (
    SELECT id FROM public.applications
    WHERE user_id = auth.uid()
       OR applicant_id = auth.uid()
       OR lower(email) = lower(COALESCE((auth.jwt()->>'email')::text, ''))
  )
);

-- 3. Fix messages SELECT for applicants: also match by user_id and email
DROP POLICY IF EXISTS "Applicants can read own messages" ON public.messages;
CREATE POLICY "Applicants can read own messages"
ON public.messages FOR SELECT TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.applications
    WHERE user_id = auth.uid()
       OR applicant_id = auth.uid()
       OR lower(email) = lower(COALESCE((auth.jwt()->>'email')::text, ''))
  )
);

-- 4. Fix messages UPDATE for applicants: also match by user_id and email
DROP POLICY IF EXISTS "Applicants can update own messages" ON public.messages;
CREATE POLICY "Applicants can update own messages"
ON public.messages FOR UPDATE TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.applications
    WHERE user_id = auth.uid()
       OR applicant_id = auth.uid()
       OR lower(email) = lower(COALESCE((auth.jwt()->>'email')::text, ''))
  )
);

-- 5. Allow profiles to be inserted (needed for auto-creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
