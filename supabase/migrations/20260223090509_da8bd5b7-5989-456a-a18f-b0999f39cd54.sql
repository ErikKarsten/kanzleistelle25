
-- Drop the restrictive policy
DROP POLICY IF EXISTS "allow_public_insert" ON public.applications;

-- Create a PERMISSIVE policy for anonymous inserts
CREATE POLICY "allow_public_insert"
ON public.applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
