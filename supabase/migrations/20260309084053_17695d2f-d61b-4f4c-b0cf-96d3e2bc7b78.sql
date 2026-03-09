
-- Create messages table for applicant-employer chat
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('applicant', 'employer')),
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Applicants can read messages for their own applications
CREATE POLICY "Applicants can read own messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE applicant_id = auth.uid()
  )
);

-- Applicants can insert messages for their own applications
CREATE POLICY "Applicants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_type = 'applicant'
  AND application_id IN (
    SELECT id FROM public.applications WHERE applicant_id = auth.uid()
  )
);

-- Employers can read messages for applications to their jobs
CREATE POLICY "Employers can read messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  application_id IN (
    SELECT a.id FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    JOIN public.companies c ON j.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
  OR application_id IN (
    SELECT a.id FROM public.applications a
    JOIN public.companies c ON a.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Employers can insert messages for applications to their jobs
CREATE POLICY "Employers can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_type = 'employer'
  AND (
    application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      JOIN public.companies c ON j.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
    OR application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.companies c ON a.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  )
);

-- Employers can mark messages as read
CREATE POLICY "Employers can update messages"
ON public.messages FOR UPDATE
TO authenticated
USING (
  application_id IN (
    SELECT a.id FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    JOIN public.companies c ON j.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
  OR application_id IN (
    SELECT a.id FROM public.applications a
    JOIN public.companies c ON a.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Applicants can mark messages as read
CREATE POLICY "Applicants can update own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE applicant_id = auth.uid()
  )
);

-- Admins can see all messages
CREATE POLICY "Admins can manage messages"
ON public.messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
