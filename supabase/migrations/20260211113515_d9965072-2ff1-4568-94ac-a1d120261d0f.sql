
-- Drop policies that use the app_role enum cast causing the error
DROP POLICY IF EXISTS "Admins have full company access" ON public.companies;
DROP POLICY IF EXISTS "Users can create own company" ON public.companies;

-- Recreate insert policy using pure text comparison
CREATE POLICY "Users can create own company"
ON public.companies
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id)
  OR
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::text
  ))
);
