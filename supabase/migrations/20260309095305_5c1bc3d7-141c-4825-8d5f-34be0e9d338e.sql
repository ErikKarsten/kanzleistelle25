
CREATE OR REPLACE FUNCTION public.link_application_to_user(_application_id uuid, _user_id uuid, _email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Update ALL applications with this email to link them to the new user
  UPDATE public.applications
  SET applicant_id = _user_id
  WHERE email = _email
    AND applicant_id IS NULL;
    
  -- Insert candidate role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'candidate')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
