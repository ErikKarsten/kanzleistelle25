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

// --- Nominatim (OpenStreetMap) Geocoding: geteiltes Rate-Limit + Cache ---
// Ein einziger Timestamp für die ganze App, damit zwei Seiten, die gleichzeitig
// geocoden (z.B. Bewerbungsformular + Arbeitgeber-Umkreissuche), nicht zusammen
// Nominatims Fair-Use-Limit (1 req/s) überschreiten.

let lastNominatimCall = 0;

async function throttleNominatim(): Promise<void> {
  const delay = Math.max(0, 1100 - (Date.now() - lastNominatimCall));
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  lastNominatimCall = Date.now();
}

/** Forward-Geocoding: Freitext-Ort/Adresse -> Koordinaten + PLZ. */
export async function geocodeQuery(
  query: string
): Promise<{ lat: number; lon: number; postcode?: string } | null> {
  const key = `gc_${query.toLowerCase().replace(/\s+/g, "_")}`;
  const cached = sessionStorage.getItem(key);
  if (cached !== null) return cached === "null" ? null : JSON.parse(cached);

  await throttleNominatim();

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Deutschland")}&format=json&limit=1&accept-language=de&addressdetails=1`;
    const res = await fetch(url, { headers: { "User-Agent": "kanzleistelle25/1.0" } });
    const data = await res.json();
    if (data[0]) {
      const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        postcode: data[0].address?.postcode as string | undefined,
      };
      sessionStorage.setItem(key, JSON.stringify(result));
      return result;
    }
  } catch {}
  sessionStorage.setItem(key, "null");
  return null;
}

/** Löst eine 5-stellige PLZ zum Ortsnamen auf (z.B. "97421" -> "Schweinfurt"). */
export async function resolveOrtFromPlz(plz: string): Promise<string | null> {
  if (!isPlz(plz)) return null;
  const key = `ort_${plz}`;
  const cached = sessionStorage.getItem(key);
  if (cached !== null) return cached === "null" ? null : JSON.parse(cached);

  await throttleNominatim();

  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(plz)}&country=Deutschland&format=json&limit=1&accept-language=de&addressdetails=1`;
    const res = await fetch(url, { headers: { "User-Agent": "kanzleistelle25/1.0" } });
    const data = await res.json();
    const ort: string | null =
      data[0]?.address?.city ?? data[0]?.address?.town ?? data[0]?.address?.village ?? data[0]?.address?.municipality ?? null;
    sessionStorage.setItem(key, JSON.stringify(ort));
    return ort;
  } catch {
    sessionStorage.setItem(key, "null");
    return null;
  }
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
