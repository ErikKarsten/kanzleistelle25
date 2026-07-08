-- =====================================================================
-- 1. RLS auf applications REAKTIVIEREN
--    Table Editor zeigt RLS aktuell als deaktiviert. Solange das so
--    ist, greift KEINE der unten stehenden Policies -- der GRANT allein
--    entscheidet, und der war (siehe unten) sehr breit. Das ist offenbar
--    nicht das erste Mal (vgl. Migration 20260206133518, Kommentar
--    "was disabled somehow"), vermutlich ein manueller Dashboard-Toggle.
-- =====================================================================
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. Zombie-INSERT-Policies entfernen
--    "Allow public insert" und "allow_public_insert" wurden vor Monaten
--    angelegt (TO anon, authenticated, WITH CHECK true) und nie wieder
--    gedroppt. Solange RLS aus war, war das irrelevant. Sobald RLS an
--    ist, würden sie die neuere, strengere Policy "Public can submit
--    applications" (Pflichtfelder first_name/last_name/email) aushebeln,
--    weil mehrere PERMISSIVE-Policies für denselben Befehl per OR
--    verknüpft werden -- eine einzige WITH CHECK (true) reicht dann,
--    damit die Validierung wirkungslos wird.
-- =====================================================================
DROP POLICY IF EXISTS "Allow public insert" ON public.applications;
DROP POLICY IF EXISTS "allow_public_insert" ON public.applications;

-- =====================================================================
-- 3. Öffentliche "Schaufenster"-View ohne Kontaktdaten
--    Nur unkritische Spalten (Live-Schema, von dir im Table Editor
--    verifiziert). Kein first_name/last_name/email/phone/internal_notes/
--    *_url/applicant_id/user_id/kanzlei_id/company_id.
--    Archivierte Bewerbungen werden nicht gezeigt (gleiches Verhalten
--    wie der bisherige is_archived=false Filter im Frontend).
-- =====================================================================
CREATE OR REPLACE VIEW public.applications_public AS
SELECT
  id,  -- opake UUID, kein personenbezogenes Merkmal, wird nur als React-Key gebraucht
  experience,
  experience_years,
  position,
  location,
  postal_code,
  gehaltsvorstellung,
  salary_expectation,
  notice_period,
  special_skills,
  earliest_start_date,
  eintrittsdatum,
  status,
  applicant_role,
  created_at
FROM public.applications
WHERE is_archived = false;

-- Views laufen standardmäßig mit den Rechten des Owners (kein
-- security_invoker gesetzt) -- die RLS von applications greift hier
-- absichtlich nicht, weil ohnehin nur die oben gelisteten unkritischen
-- Spalten exponiert werden.
GRANT SELECT ON public.applications_public TO anon, authenticated;

-- =====================================================================
-- 4. Anon-Rechte auf der echten Tabelle einschränken
--    Bisher: GRANT SELECT, INSERT, UPDATE, DELETE ... TO anon
--    (ungebremst, weil RLS aus war). Ab jetzt darf anon nur noch
--    einfügen (Bewerbungs-Funnel bleibt erhalten). Lesen/Ändern/Löschen
--    läuft für anon ausschließlich noch über applications_public bzw.
--    für eingeloggte Rollen über die bestehenden Policies.
-- =====================================================================
REVOKE ALL ON public.applications FROM anon;
GRANT INSERT ON public.applications TO anon;
