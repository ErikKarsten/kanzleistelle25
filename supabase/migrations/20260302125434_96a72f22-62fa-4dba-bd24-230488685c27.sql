
-- Add database-level input validation constraints

-- Applications table
ALTER TABLE public.applications
  ADD CONSTRAINT applications_email_valid 
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT applications_first_name_length 
    CHECK (first_name IS NULL OR char_length(first_name) BETWEEN 1 AND 100),
  ADD CONSTRAINT applications_last_name_length 
    CHECK (last_name IS NULL OR char_length(last_name) BETWEEN 1 AND 100),
  ADD CONSTRAINT applications_phone_length 
    CHECK (phone IS NULL OR char_length(phone) <= 30);

-- Jobs table
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_title_length 
    CHECK (char_length(title) BETWEEN 2 AND 200),
  ADD CONSTRAINT jobs_salary_valid 
    CHECK (
      (salary_min IS NULL OR salary_min >= 0) AND
      (salary_max IS NULL OR salary_max >= 0) AND
      (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min)
    ),
  ADD CONSTRAINT jobs_description_length 
    CHECK (description IS NULL OR char_length(description) <= 10000);

-- Companies table
ALTER TABLE public.companies
  ADD CONSTRAINT companies_name_length 
    CHECK (char_length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT companies_website_format 
    CHECK (website IS NULL OR website ~ '^https?://');

-- Profiles table
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_valid 
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
