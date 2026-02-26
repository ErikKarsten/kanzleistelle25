
-- Fix: Change view to SECURITY INVOKER (uses querying user's permissions, not creator's)
ALTER VIEW public.public_companies SET (security_invoker = on);

-- Fix: Restrict resume uploads to only the applications/ path prefix
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;

-- Replace with a more restrictive policy: only allow uploads to applications/ subfolder
CREATE POLICY "Applicants can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'applications'
);
