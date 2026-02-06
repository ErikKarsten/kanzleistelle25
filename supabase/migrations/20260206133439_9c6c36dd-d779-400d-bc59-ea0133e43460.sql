-- Create index for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);

-- Drop existing overly permissive policies on companies
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Allow public read" ON public.companies;
DROP POLICY IF EXISTS "Admins have full access" ON public.companies;

-- New RLS policies for companies
-- Everyone can view companies (for public job listings)
CREATE POLICY "Public can view companies"
ON public.companies FOR SELECT
USING (true);

-- Employers can insert their own company
CREATE POLICY "Users can create own company"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Employers can update their own company
CREATE POLICY "Users can update own company"
ON public.companies FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins have full access
CREATE POLICY "Admins have full company access"
ON public.companies FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update jobs table: ensure employer_id links properly
-- Drop conflicting policies first
DROP POLICY IF EXISTS "Jeder kann Jobs erstellen" ON public.jobs;

-- Create new INSERT policy for employers creating jobs for their company
CREATE POLICY "Employers can create jobs for own company"
ON public.jobs FOR INSERT
WITH CHECK (
  auth.uid() = employer_id 
  AND (
    company_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.companies 
      WHERE id = company_id AND user_id = auth.uid()
    )
  )
);

-- Update existing employer policy to be more specific
DROP POLICY IF EXISTS "Employers can manage own jobs" ON public.jobs;
CREATE POLICY "Employers can manage own jobs"
ON public.jobs FOR ALL
USING (
  employer_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = jobs.company_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  employer_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = jobs.company_id AND user_id = auth.uid()
  )
);

-- Function to auto-assign employer role on company creation
CREATE OR REPLACE FUNCTION public.assign_employer_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if role doesn't already exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'employer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign employer role when company is created
DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_employer_role();

-- Add function to check if user is employer
CREATE OR REPLACE FUNCTION public.is_employer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'employer'
  )
$$;

-- Allow INSERT into user_roles for the trigger function
DROP POLICY IF EXISTS "Allow role assignment" ON public.user_roles;
CREATE POLICY "Allow role assignment via trigger"
ON public.user_roles FOR INSERT
WITH CHECK (true);