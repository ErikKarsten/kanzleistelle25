-- 1. Kontaktanfragen älter als 1 Jahr komplett löschen
CREATE OR REPLACE FUNCTION delete_old_contact_leads()
RETURNS void AS $$
BEGIN
  DELETE FROM contact_leads
  WHERE created_at < now() - interval '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bewerbungen älter als 1 Jahr anonymisieren (Statistik bleibt erhalten)
CREATE OR REPLACE FUNCTION anonymize_old_applications()
RETURNS void AS $$
BEGIN
  UPDATE applications
  SET
    first_name = 'Gelöscht',
    last_name = 'Gelöscht',
    email = NULL,
    phone = NULL,
    cover_letter = NULL,
    resume_url = NULL,
    cover_letter_url = NULL,
    lebenslauf_url = NULL,
    zeugnis_url = NULL,
    anschreiben_url = NULL,
    certificates_url = NULL,
    internal_notes = NULL,
    applicant_role_other = NULL,
    location = NULL,
    postal_code = NULL
  WHERE created_at < now() - interval '1 year'
    AND email IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Beide Funktionen täglich um 3 Uhr nachts automatisch ausführen
SELECT cron.schedule(
  'daily-data-retention-cleanup',
  '0 3 * * *',
  $$
    SELECT delete_old_contact_leads();
    SELECT anonymize_old_applications();
  $$
);
