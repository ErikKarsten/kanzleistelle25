
-- Add just_reactivated flag to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS just_reactivated boolean NOT NULL DEFAULT false;

-- Update the trigger to set just_reactivated when company is reactivated
CREATE OR REPLACE FUNCTION public.deactivate_jobs_on_company_block()
RETURNS TRIGGER AS $$
BEGIN
  -- When company is deactivated: deactivate all its jobs
  IF OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE public.jobs
    SET is_active = false
    WHERE company_id = NEW.id AND is_active = true;
  END IF;

  -- When company is reactivated: clear reactivation request and set welcome flag
  IF OLD.is_active = false AND NEW.is_active = true THEN
    NEW.reactivation_requested := false;
    NEW.reactivation_requested_at := NULL;
    NEW.just_reactivated := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
