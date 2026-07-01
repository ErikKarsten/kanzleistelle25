// src/lib/geo.ts
// Umkreissuche-Helfer für Kanzleistelle24
// PLZ -> Koordinaten Lookup + Haversine-Distanzberechnung

type Coords = [number, number]; // [lat, lng]

let plzCache: Record<string, Coords> | null = null;

/**
 * Lädt die PLZ->Koordinaten-Tabelle einmalig (lazy, ~264 KB).
 * Liegt unter src/data/plz-coords.json.
 */
export async function loadPlzCoords(): Promise<Record<string, Coords>> {
  if (plzCache) return plzCache;
  const mod = await import("@/data/plz-coords.json");
  plzCache = (mod.default ?? mod) as Record<string, Coords>;
  return plzCache;
}

/** Holt Koordinaten zu einer PLZ (oder null, wenn unbekannt). */
export function getCoords(
  plz: string | null | undefined,
  table: Record<string, Coords>
): Coords | null {
  const key = (plz ?? "").trim().slice(0, 5);
  return table[key] ?? null;
}

/** Distanz zwischen zwei Koordinaten in Kilometern (Haversine-Formel). */
export function haversineKm([lat1, lon1]: Coords, [lat2, lon2]: Coords): number {
  const R = 6371; // Erdradius in km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Erkennt eine vollständige 5-stellige PLZ. */
export function isPlz(input: string): boolean {
  return /^\d{5}$/.test(input.trim());
}

/** True, wenn ein Kandidat als "deutschlandweit verfügbar" gilt. */
export function isDeutschlandweit(candidate: {
  postal_code?: string | null;
  location?: string | null;
}): boolean {
  const pc = (candidate.postal_code ?? "").trim();
  return (
    pc === "" ||
    pc === "00000" ||
    /deutschlandweit/i.test(candidate.location ?? "")
  );
}
