-- Add status and sort_order columns to articles
ALTER TABLE public.articles 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Migrate existing data: published articles get status 'published'
UPDATE public.articles SET status = 'published' WHERE is_published = true;
UPDATE public.articles SET status = 'draft' WHERE is_published = false;

-- Update RLS: replace is_published check with status check
DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
CREATE POLICY "Public can read published articles"
  ON public.articles FOR SELECT
  USING (status = 'published');