-- Create or replace the function to assign employer role
CREATE OR REPLACE FUNCTION public.assign_employer_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only insert if role doesn't already exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'employer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS assign_employer_role_on_company_insert ON public.companies;

-- Create the trigger
CREATE TRIGGER assign_employer_role_on_company_insert
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.assign_employer_role();

-- Also ensure there's a unique constraint on user_roles for ON CONFLICT to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key' 
    AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;