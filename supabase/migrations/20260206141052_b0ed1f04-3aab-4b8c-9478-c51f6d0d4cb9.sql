-- Create trigger to automatically assign employer role when a company is created
CREATE OR REPLACE TRIGGER assign_employer_role_on_company_insert
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_employer_role();

-- Add comment for documentation
COMMENT ON TRIGGER assign_employer_role_on_company_insert ON public.companies IS 'Automatically assigns employer role when a new company is created';