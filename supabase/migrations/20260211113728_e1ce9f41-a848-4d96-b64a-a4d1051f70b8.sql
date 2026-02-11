
-- Add is_active column to companies for archive functionality
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add ON DELETE CASCADE to jobs.company_id so deleting a company removes its jobs
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_company_id_fkey;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
