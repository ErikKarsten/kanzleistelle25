-- RLS policies for article-images bucket
CREATE POLICY "Public can view article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Admins can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update article images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'article-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete article images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND public.has_role(auth.uid(), 'admin')
);