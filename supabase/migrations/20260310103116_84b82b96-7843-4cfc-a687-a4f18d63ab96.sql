
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS earliest_start_date date,
  ADD COLUMN IF NOT EXISTS salary_expectation text,
  ADD COLUMN IF NOT EXISTS notice_period text,
  ADD COLUMN IF NOT EXISTS special_skills text,
  ADD COLUMN IF NOT EXISTS certificates_url text,
  ADD COLUMN IF NOT EXISTS cover_letter_url text;
