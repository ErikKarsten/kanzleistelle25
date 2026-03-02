
-- Fix 1: Restrict user_roles read access (users see own roles, admins see all)
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));
