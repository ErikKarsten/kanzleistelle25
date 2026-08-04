-- Persönlicher, dauerhafter Status-Link für Bewerber ohne Account (siehe /bewerbung-status).
-- Kein Ablaufdatum: der Token soll dauerhaft als Zugriffsschlüssel für den
-- Bewerbungsstatus dienen, unabhängig von einem Login. Ausgabe erfolgt
-- ausschließlich über die Edge Function get-application-status (Service Role),
-- nicht über applications_public oder direkten anon-Zugriff.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS status_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS applications_status_token_key
  ON public.applications (status_token);
