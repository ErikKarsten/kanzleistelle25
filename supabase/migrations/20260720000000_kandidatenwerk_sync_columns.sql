-- Sync-Grundlage Kanzleistelle24 <-> Kandidatenwerk
-- Gegenstueck zu den in Kandidatenwerk bereits vorhandenen Sync-Spalten.
-- UNIQUE stellt sicher, dass nie zwei Kanzleistelle24-Datensaetze auf denselben
-- Kandidatenwerk-Datensatz zeigen (verhindert Duplikate beim Sync).

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS kandidatenwerk_candidate_id uuid UNIQUE;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS kandidatenwerk_client_id uuid UNIQUE;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS kandidatenwerk_campaign_id uuid UNIQUE;
