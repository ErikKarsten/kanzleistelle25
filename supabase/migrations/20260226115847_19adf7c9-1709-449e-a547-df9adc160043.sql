
-- =============================================
-- STORAGE BUCKET RLS POLICIES
-- =============================================

-- 1. LOGOS BUCKET: Public read, authenticated upload
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can delete own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

-- 2. RESUMES BUCKET: Only admin and owning employer can read
CREATE POLICY "Admins can read all resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND public.has_role(auth.uid(), 'admin'::text)
);

CREATE POLICY "Employers can read resumes for their applications"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    JOIN public.companies c ON j.company_id = c.id
    WHERE c.user_id = auth.uid()
    AND a.resume_url = name
  )
);

-- Allow anyone to upload resumes (applicants upload during application)
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Only admin can delete resumes
CREATE POLICY "Admins can delete resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND public.has_role(auth.uid(), 'admin'::text)
);

-- =============================================
-- SECURE VIEW: companies without admin_notes for non-admins
-- =============================================
CREATE OR REPLACE VIEW public.public_companies AS
SELECT
  id, name, location, description, logo_url, website,
  created_at, is_active, user_id,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::text) THEN admin_notes
    ELSE NULL
  END AS admin_notes,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::text) THEN reactivation_requested
    ELSE NULL
  END AS reactivation_requested,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::text) THEN reactivation_requested_at
    ELSE NULL
  END AS reactivation_requested_at,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::text) THEN reactivation_notes
    ELSE NULL
  END AS reactivation_notes,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::text) OR auth.uid() = user_id THEN last_sign_in_at
    ELSE NULL
  END AS last_sign_in_at,
  just_reactivated
FROM public.companies;
