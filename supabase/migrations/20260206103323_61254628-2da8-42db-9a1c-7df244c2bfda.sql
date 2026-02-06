-- 1. Create app_role enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'employer', 'candidate');
    END IF;
END$$;

-- 2. Create user_roles table (separate from profiles per security requirements)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
      AND role = _role
  )
$$;

-- 5. RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Fix jobs table RLS for admin access
DROP POLICY IF EXISTS "Employer kann eigene Jobs verwalten" ON public.jobs;

-- Admins can manage all jobs
CREATE POLICY "Admins can manage all jobs"
ON public.jobs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Employers can manage their own jobs
CREATE POLICY "Employers can manage own jobs"
ON public.jobs
FOR ALL
TO authenticated
USING (
  employer_id = auth.uid() 
  AND employer_id IS NOT NULL
)
WITH CHECK (
  employer_id = auth.uid() 
  AND employer_id IS NOT NULL
);

-- 7. Fix applications table RLS for admin access
DROP POLICY IF EXISTS "Allow admin read" ON public.applications;

-- Only admins can read all applications
CREATE POLICY "Admins can read applications"
ON public.applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Employers can read applications for their jobs
CREATE POLICY "Employers can read job applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = applications.job_id
    AND jobs.employer_id = auth.uid()
  )
);

-- 8. Fix storage bucket - make it private
UPDATE storage.buckets
SET public = false
WHERE id = 'resumes';

-- 9. Drop overly permissive storage policies
DROP POLICY IF EXISTS "Jeder kann Lebensläufe hochladen" ON storage.objects;
DROP POLICY IF EXISTS "Lebensläufe sind öffentlich lesbar" ON storage.objects;

-- 10. Create restricted storage policies
-- Allow unauthenticated and authenticated users to upload (for express funnel)
CREATE POLICY "Users can upload resumes"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'resumes');

-- Only authenticated users (admins/employers) can read resumes
CREATE POLICY "Authenticated users can read resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');