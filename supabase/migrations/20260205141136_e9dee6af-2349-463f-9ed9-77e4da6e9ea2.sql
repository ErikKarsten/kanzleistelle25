-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', true, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload resumes (for express applications)
CREATE POLICY "Jeder kann Lebensläufe hochladen"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Allow public read access to resumes
CREATE POLICY "Lebensläufe sind öffentlich lesbar"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resumes');