-- Drop the broken policies that cause type casting errors
DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.jobs;

-- Recreate with proper type casting
CREATE POLICY "Admins can manage all jobs" 
ON public.jobs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));