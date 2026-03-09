
-- 1. RLS policy: candidates can SELECT their own applications
CREATE POLICY "Candidates can view own applications"
ON public.applications FOR SELECT
TO authenticated
USING (applicant_id = auth.uid());

-- 2. RLS policy: allow users to insert their own role into user_roles
CREATE POLICY "Users can insert own role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. Security definer function to link application after signup
CREATE OR REPLACE FUNCTION public.link_application_to_user(
  _application_id uuid,
  _user_id uuid,
  _email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the application to link it to the new user
  UPDATE public.applications
  SET applicant_id = _user_id
  WHERE id = _application_id
    AND email = _email
    AND applicant_id IS NULL;
    
  -- Insert candidate role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'candidate')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
