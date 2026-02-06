-- Enable RLS on applications table (was disabled somehow)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Fix the overly permissive user_roles INSERT policy
-- The trigger function uses SECURITY DEFINER so it bypasses RLS
DROP POLICY IF EXISTS "Allow role assignment via trigger" ON public.user_roles;

-- Only admins can directly insert roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));