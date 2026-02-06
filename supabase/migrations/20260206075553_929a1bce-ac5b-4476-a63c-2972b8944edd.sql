-- Drop the existing restrictive INSERT policies
DROP POLICY IF EXISTS "Jeder kann Express-Bewerbung einreichen" ON public.applications;
DROP POLICY IF EXISTS "User kann sich bewerben" ON public.applications;

-- Create a PERMISSIVE policy for express applications (anonymous users)
CREATE POLICY "Express-Bewerbung ohne Login" 
ON public.applications 
FOR INSERT 
TO public
WITH CHECK (
  applicant_id IS NULL 
  AND first_name IS NOT NULL 
  AND email IS NOT NULL
);

-- Create a PERMISSIVE policy for logged-in users
CREATE POLICY "Eingeloggte User können sich bewerben" 
ON public.applications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = applicant_id);