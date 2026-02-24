
-- Trigger: when a company is set to inactive, deactivate all its jobs
CREATE OR REPLACE FUNCTION public.deactivate_jobs_on_company_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when is_active changes from true to false
  IF OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE public.jobs
    SET is_active = false
    WHERE company_id = NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deactivate_jobs_on_company_block
  AFTER UPDATE OF is_active ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.deactivate_jobs_on_company_block();
