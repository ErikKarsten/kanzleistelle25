-- Drop existing INSERT policies that are restrictive
DROP POLICY IF EXISTS "Anon kann Express-Bewerbung einreichen" ON public.applications;
DROP POLICY IF EXISTS "Authenticated kann sich bewerben" ON public.applications;

-- Create a PERMISSIVE policy allowing anyone (including anon) to insert
CREATE POLICY "Allow public insert" 
ON public.applications 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Ensure read policies only allow authenticated users
DROP POLICY IF EXISTS "Bewerber sieht eigene Bewerbungen" ON public.applications;
DROP POLICY IF EXISTS "Employer sieht Bewerbungen seiner Jobs" ON public.applications;

-- Allow authenticated users to read applications (admins/employers)
CREATE POLICY "Allow admin read" 
ON public.applications 
FOR SELECT 
TO authenticated
USING (true);