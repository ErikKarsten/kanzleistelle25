-- Add express applicant fields for applications without login
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;

-- Allow anyone to insert express applications (without login)
CREATE POLICY "Jeder kann Express-Bewerbung einreichen"
ON public.applications
FOR INSERT
WITH CHECK (applicant_id IS NULL AND first_name IS NOT NULL AND email IS NOT NULL);