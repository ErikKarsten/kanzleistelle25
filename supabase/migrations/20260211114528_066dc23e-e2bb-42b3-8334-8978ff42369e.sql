
-- Drop policies that still use app_role enum (causing text = app_role error)
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can read applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.jobs;

-- Drop duplicate insert policy on applications
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.applications;

-- Ensure public SELECT on jobs exists
DROP POLICY IF EXISTS "Jobs sind öffentlich lesbar" ON public.jobs;
DROP POLICY IF EXISTS "Jeder kann Jobs lesen" ON public.jobs;
CREATE POLICY "Public can read active jobs" ON public.jobs FOR SELECT USING (is_active = true);
