
-- Add website column to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website text;

-- Drop the restrictive INSERT policy that blocks admin inserts with null user_id
DROP POLICY IF EXISTS "Users can create own company" ON public.companies;

-- Recreate as: admins can insert any company, users can insert their own
CREATE POLICY "Users can create own company"
ON public.companies
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);
