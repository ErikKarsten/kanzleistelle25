-- Sicherer Insert-Pfad fuer den oeffentlichen Bewerbungsfunnel (ApplyModal.tsx,
-- InitiativeApplyModal.tsx): anon soll den frisch erzeugten status_token der
-- eigenen, gerade eingefuegten Zeile bekommen, ohne dass dafuer SELECT-Rechte
-- auf der applications-Tabelle noetig sind (die haetten status_token fuer
-- ALLE Zeilen lesbar gemacht, nicht nur die eigene -- siehe
-- 20260806000000_applications_grant_status_token_select.sql).
--
-- SECURITY DEFINER fuehrt den INSERT mit den Rechten des Funktions-Owners
-- aus und umgeht damit die RLS-Policy "Public can submit applications"
-- (Tabellenbesitzer sind von RLS ausgenommen). Die dortigen WITH-CHECK-
-- Bedingungen (first_name/last_name/email nicht leer) werden deshalb hier
-- manuell nachgebildet.
CREATE OR REPLACE FUNCTION public.submit_application(
  _id uuid,
  _first_name text,
  _last_name text,
  _email text,
  _phone text,
  _applicant_role text,
  _experience text,
  _job_id uuid DEFAULT NULL,
  _company_id uuid DEFAULT NULL,
  _applicant_role_other text DEFAULT NULL,
  _location text DEFAULT NULL,
  _postal_code text DEFAULT NULL,
  _internal_notes text DEFAULT NULL,
  _cover_letter text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _status_token uuid;
BEGIN
  IF NULLIF(btrim(COALESCE(_first_name, '')), '') IS NULL THEN
    RAISE EXCEPTION 'first_name ist erforderlich';
  END IF;
  IF NULLIF(btrim(COALESCE(_last_name, '')), '') IS NULL THEN
    RAISE EXCEPTION 'last_name ist erforderlich';
  END IF;
  IF NULLIF(btrim(COALESCE(_email, '')), '') IS NULL THEN
    RAISE EXCEPTION 'email ist erforderlich';
  END IF;

  INSERT INTO public.applications (
    id, job_id, company_id, first_name, last_name, email, phone,
    applicant_role, applicant_role_other, experience,
    location, postal_code, internal_notes, cover_letter
  ) VALUES (
    _id, _job_id, _company_id, _first_name, _last_name, _email, _phone,
    _applicant_role, _applicant_role_other, _experience,
    _location, _postal_code, _internal_notes, _cover_letter
  )
  RETURNING status_token INTO _status_token;

  RETURN _status_token;
END;
$$;

-- Postgres erteilt EXECUTE auf neue Funktionen standardmaessig an PUBLIC
-- (anders als bei Tabellen). Das hier explizit einschraenken, damit nur
-- die tatsaechlich vorgesehenen Rollen die Funktion aufrufen koennen.
REVOKE ALL ON FUNCTION public.submit_application(
  uuid, text, text, text, text, text, text, uuid, uuid, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_application(
  uuid, text, text, text, text, text, text, uuid, uuid, text, text, text, text, text
) TO anon, authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
