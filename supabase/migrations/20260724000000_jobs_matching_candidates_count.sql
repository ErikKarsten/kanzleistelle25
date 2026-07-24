-- Kandidatenwerk-Sync: Trefferzahl aus dem Matching pro Stellenanzeige
-- Wird bei jedem Sync mit dem aktuellen Match-Count ueberschrieben.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS matching_candidates_count integer DEFAULT 0;
