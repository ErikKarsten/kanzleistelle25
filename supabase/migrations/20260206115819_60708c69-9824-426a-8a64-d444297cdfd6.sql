-- Add is_archived column to applications for archive functionality
ALTER TABLE public.applications 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- Add index for faster querying
CREATE INDEX idx_applications_is_archived ON public.applications(is_archived);

-- Enable RLS policies for companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Public can read companies
CREATE POLICY "Anyone can view companies" ON public.companies
FOR SELECT USING (true);

-- Admins can manage companies
CREATE POLICY "Admins can manage companies" ON public.companies
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add delete policy for applications (admins only)
CREATE POLICY "Admins can delete applications" ON public.applications
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));