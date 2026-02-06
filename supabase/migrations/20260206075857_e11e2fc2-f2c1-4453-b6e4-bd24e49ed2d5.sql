-- Add missing columns (using applicant_role instead of reserved word current_role)
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS applicant_role text,
ADD COLUMN IF NOT EXISTS experience text;

-- Drop the existing INSERT policies
DROP POLICY IF EXISTS "Express-Bewerbung ohne Login" ON public.applications;
DROP POLICY IF EXISTS "Eingeloggte User können sich bewerben" ON public.applications;

-- Create a proper PERMISSIVE policy for anonymous users (anon role)
CREATE POLICY "Anon kann Express-Bewerbung einreichen" 
ON public.applications 
FOR INSERT 
TO anon
WITH CHECK (
  applicant_id IS NULL 
  AND first_name IS NOT NULL 
  AND email IS NOT NULL
);

-- Create a PERMISSIVE policy for authenticated users
CREATE POLICY "Authenticated kann sich bewerben" 
ON public.applications 
FOR INSERT 
TO authenticated
WITH CHECK (
  (applicant_id IS NULL AND first_name IS NOT NULL AND email IS NOT NULL)
  OR (auth.uid() = applicant_id)
);