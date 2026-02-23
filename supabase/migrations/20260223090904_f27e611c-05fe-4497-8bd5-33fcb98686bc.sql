
-- Grant necessary permissions on applications table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;

-- Also add SELECT policies for admin access
CREATE POLICY "admins_can_view_applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "admins_can_update_applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "admins_can_delete_applications"
ON public.applications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
