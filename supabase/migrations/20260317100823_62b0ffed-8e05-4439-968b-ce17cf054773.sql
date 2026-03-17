-- Fix mutable search_path warnings on public functions
CREATE OR REPLACE FUNCTION public.is_employer()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'employer'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profile_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.last_profile_update = NOW();
    RETURN NEW;
END;
$$;

-- Remove overly permissive jobs INSERT policy; existing admin and employer-specific INSERT policies remain in place
DROP POLICY IF EXISTS "Admins and Employers can insert jobs" ON public.jobs;