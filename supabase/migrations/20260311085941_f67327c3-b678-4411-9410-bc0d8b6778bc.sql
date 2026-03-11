
-- Trigger: When an employer updates a published job, reset status to pending_review
-- This prevents employers from bypassing admin approval

CREATE OR REPLACE FUNCTION public.reset_job_status_on_employer_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only reset if the updater is NOT an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    -- If the job was published and content fields changed, reset to pending_review
    IF OLD.status = 'published' AND (
      OLD.title IS DISTINCT FROM NEW.title OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.requirements IS DISTINCT FROM NEW.requirements OR
      OLD.location IS DISTINCT FROM NEW.location OR
      OLD.employment_type IS DISTINCT FROM NEW.employment_type OR
      OLD.working_model IS DISTINCT FROM NEW.working_model OR
      OLD.salary_range IS DISTINCT FROM NEW.salary_range OR
      OLD.salary_min IS DISTINCT FROM NEW.salary_min OR
      OLD.salary_max IS DISTINCT FROM NEW.salary_max OR
      OLD.benefits IS DISTINCT FROM NEW.benefits OR
      OLD.contact_person_id IS DISTINCT FROM NEW.contact_person_id
    ) THEN
      NEW.status := 'pending_review';
      NEW.is_active := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trigger_reset_job_status_on_edit ON public.jobs;
CREATE TRIGGER trigger_reset_job_status_on_edit
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_job_status_on_employer_edit();
