-- Freitext-Berufsbezeichnung, wenn ein Bewerber bei der Rollen-Auswahl
-- "Sonstige" (applicant_role = 'sonstige') wählt.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS applicant_role_other TEXT;
