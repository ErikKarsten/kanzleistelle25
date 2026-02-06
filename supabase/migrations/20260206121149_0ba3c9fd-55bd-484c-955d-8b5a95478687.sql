-- Drop the broken policies
DROP POLICY IF EXISTS "Admins can do everything with companies" ON public.companies;

-- Fix the existing policy to properly cast the role
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
CREATE POLICY "Admins can manage companies" 
ON public.companies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));