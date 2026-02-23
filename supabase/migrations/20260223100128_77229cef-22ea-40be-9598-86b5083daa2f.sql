
-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;

-- Create a PERMISSIVE UPDATE policy for admins
CREATE POLICY "Admins can update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Also fix the SELECT policy to be permissive
DROP POLICY IF EXISTS "admins_see_all_applications" ON public.applications;

CREATE POLICY "admins_see_all_applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Fix INSERT policies - keep one permissive for anonymous inserts
DROP POLICY IF EXISTS "allow_public_application_submission" ON public.applications;
DROP POLICY IF EXISTS "secure_public_insert" ON public.applications;

CREATE POLICY "allow_public_application_insert"
ON public.applications
FOR INSERT
WITH CHECK (true);

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete applications"
ON public.applications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
