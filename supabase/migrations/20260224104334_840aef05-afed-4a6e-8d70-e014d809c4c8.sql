
-- Add reactivation request fields to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS reactivation_requested boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reactivation_requested_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_sign_in_at timestamp with time zone DEFAULT now();

-- Update the trigger to also reactivate jobs when company is reactivated
-- and to clear the reactivation flag
CREATE OR REPLACE FUNCTION public.deactivate_jobs_on_company_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When company is deactivated: deactivate all its jobs
  IF OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE public.jobs
    SET is_active = false
    WHERE company_id = NEW.id AND is_active = true;
  END IF;

  -- When company is reactivated: clear reactivation request flag
  IF OLD.is_active = false AND NEW.is_active = true THEN
    NEW.reactivation_requested := false;
    NEW.reactivation_requested_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger as BEFORE UPDATE to allow modifying NEW
DROP TRIGGER IF EXISTS trigger_deactivate_jobs_on_company_block ON public.companies;

CREATE TRIGGER trigger_deactivate_jobs_on_company_block
  BEFORE UPDATE OF is_active ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.deactivate_jobs_on_company_block();
