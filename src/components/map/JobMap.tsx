import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Point } from "geojson";
import { Maximize2, Moon, Sun } from "lucide-react";

export interface MapJob {
  id: string;
  title: string;
  company: string;
  postal_code: string | null;
  city: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  employment_type?: string | null;
  benefits?: string[] | null;
  salaryText?: string | null;
  companies?: { name: string; logo_url: string | null } | null;
}

interface Props<T extends MapJob> {
  jobs: T[];
  onApply?: (job: T) => void;
  /** IDs der Stellen im Kartenausschnitt – null, wenn alle Stellen sichtbar sind */
  onVisibleChange?: (ids: Set<string> | null) => void;
  /** Erhöhen, um wieder ganz Deutschland zu zeigen */
  resetSignal?: number;
}

type MapTheme = "light" | "dark";
const STYLE_URLS: Record<MapTheme, string> = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};
const THEME_KEY = "k24-map-theme";
const GERMANY: [[number, number], [number, number]] = [
  [5.8, 47.25],
  [15.1, 55.1],
];
const NAVY = "#003366";
const GOLD = "#f2b90d";

// Farben je Kartenvariante: hell = Navy-Punkte, dunkel = goldene Punkte
const PALETTE: Record<MapTheme, { fill: string; stroke: string; text: string; dot: string; halo: string; bg: string; water: string }> = {
  light: { fill: NAVY, stroke: "#ffffff", text: "#ffffff", dot: GOLD, halo: NAVY, bg: "#f7f7f4", water: "#d5e3ef" },
  dark: { fill: GOLD, stroke: "#0b1424", text: NAVY, dot: NAVY, halo: GOLD, bg: "#0b1424", water: "#132a47" },
};

const readTheme = (): MapTheme => {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

// Ruhiger Grundstil und deutsche Ortsnamen
function applyBase(map: maplibregl.Map, theme: MapTheme) {
  const c = PALETTE[theme];
  try {
    if (map.getLayer("background")) map.setPaintProperty("background", "background-color", c.bg);
    if (map.getLayer("water")) map.setPaintProperty("water", "fill-color", c.water);
    for (const layer of map.getStyle().layers || []) {
      if (layer.type === "symbol" && (layer.layout as Record<string, unknown> | undefined)?.["text-field"] && !layer.id.startsWith("k24-")) {
        map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name:de"], ["get", "name_int"], ["get", "name"]]);
      }
    }
  } catch {
    /* Stil bleibt Standard */
  }
}

// Quelle und Ebenen für die Stellen (nach jedem Stilwechsel neu)
function ensureJobLayers(map: maplibregl.Map, theme: MapTheme, data: FeatureCollection) {
  if (map.getSource("jobs")) return;
  const c = PALETTE[theme];
  map.addSource("jobs", {
    type: "geojson",
    data,
    cluster: true,
    clusterRadius: 48,
    clusterMaxZoom: 11,
    clusterProperties: { jobs: ["+", ["get", "count"]] },
  });
  map.addLayer({
    id: "cluster-halo",
    type: "circle",
    source: "jobs",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": c.halo,
      "circle-opacity": theme === "dark" ? 0.22 : 0.16,
      "circle-radius": ["step", ["get", "jobs"], 26, 5, 31, 15, 38],
    },
  });
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "jobs",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": c.fill,
      "circle-radius": ["step", ["get", "jobs"], 18, 5, 22, 15, 27],
      "circle-stroke-width": 3,
      "circle-stroke-color": c.stroke,
    },
  });
  map.addLayer({
    id: "k24-cluster-count",
    type: "symbol",
    source: "jobs",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["to-string", ["get", "jobs"]],
      "text-font": ["Noto Sans Bold"],
      "text-size": 14,
      "text-allow-overlap": true,
    },
    paint: { "text-color": c.text },
  });
  map.addLayer({
    id: "point-halo",
    type: "circle",
    source: "jobs",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": c.halo,
      "circle-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.3, theme === "dark" ? 0.2 : 0.14],
      "circle-radius": ["case", ["boolean", ["feature-state", "hover"], false], 24, 19],
    },
  });
  map.addLayer({
    id: "points",
    type: "circle",
    source: "jobs",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": c.fill,
      "circle-radius": ["case", ["boolean", ["feature-state", "hover"], false], 15, 12],
      "circle-stroke-width": 3,
      "circle-stroke-color": c.stroke,
    },
  });
  map.addLayer({
    id: "point-dot",
    type: "circle",
    source: "jobs",
    filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "count"], 1]],
    paint: { "circle-color": c.dot, "circle-radius": 4.5 },
  });
  map.addLayer({
    id: "k24-point-count",
    type: "symbol",
    source: "jobs",
    filter: ["all", ["!", ["has", "point_count"]], [">", ["get", "count"], 1]],
    layout: {
      "text-field": ["to-string", ["get", "count"]],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: { "text-color": c.text },
  });
}

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const placeLabel = (j: MapJob) =>
  j.postal_code && j.city ? `${j.postal_code} ${j.city}` : j.location || j.city || "";

const companyName = (j: MapJob) => j.companies?.name || j.company;

const logoHtml = (j: MapJob, cls: string) =>
  j.companies?.logo_url
    ? `<img src="${esc(j.companies.logo_url)}" alt="" class="${cls}" />`
    : `<span class="${cls} k24m-logo--empty">${esc(companyName(j).slice(0, 2).toUpperCase())}</span>`;

const keyOf = (j: MapJob) => `${j.latitude!.toFixed(3)},${j.longitude!.toFixed(3)}`;

function JobMap<T extends MapJob>({ jobs, onApply, onVisibleChange, resetSignal = 0 }: Props<T>) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState<MapTheme>(readTheme);
  const themeRef = useRef<MapTheme>(theme);
  const styleThemeRef = useRef<MapTheme>(theme);
  const dataRef = useRef<FeatureCollection | null>(null);
  // Hat der Nutzer die Karte selbst bewegt? Vorher zeigt die Liste alle Stellen.
  const userMovedRef = useRef(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string> | null>(null);
  const [, setActiveKey] = useState<string | null>(null);
  const [supported] = useState(() => {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  });

  const located = useMemo(() => jobs.filter((j) => j.latitude != null && j.longitude != null), [jobs]);

  // Stellen am gleichen Ort zu einem Punkt bündeln
  const places = useMemo(() => {
    const m = new Map<string, T[]>();
    for (const j of located) {
      const k = keyOf(j);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(j);
    }
    return m;
  }, [located]);

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: [...places.entries()].map(([key, group], i) => ({
        type: "Feature" as const,
        id: i + 1,
        properties: { key, count: group.length },
        geometry: { type: "Point" as const, coordinates: [group[0].longitude!, group[0].latitude!] },
      })),
    }),
    [places]
  );
  const idByKey = useMemo(() => {
    const m = new Map<string, number>();
    geojson.features.forEach((f) => m.set(f.properties.key, f.id as number));
    return m;
  }, [geojson]);

  const updateVisible = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!userMovedRef.current) {
      setVisibleKeys(null);
      return;
    }
    const b = map.getBounds();
    const keys = new Set<string>();
    for (const [k, g] of places) {
      if (b.contains([g[0].longitude!, g[0].latitude!])) keys.add(k);
    }
    setVisibleKeys(keys.size === places.size ? null : keys);
  }, [places]);

  const setHover = useCallback(
    (key: string | null) => {
      const map = mapRef.current;
      if (!map || !map.getSource("jobs")) return;
      if (hoveredRef.current) {
        const prev = idByKey.get(hoveredRef.current);
        if (prev) map.setFeatureState({ source: "jobs", id: prev }, { hover: false });
      }
      hoveredRef.current = key;
      const id = key ? idByKey.get(key) : undefined;
      if (id) map.setFeatureState({ source: "jobs", id }, { hover: true });
    },
    [idByKey]
  );

  const openPlace = useCallback(
    (key: string, fly = false) => {
      const map = mapRef.current;
      const group = places.get(key);
      if (!map || !group) return;
      const first = group[0];
      const lngLat: [number, number] = [first.longitude!, first.latitude!];
      popupRef.current?.remove();

      let html: string;
      if (group.length === 1) {
        const j = group[0];
        const benefits = (j.benefits || []).slice(0, 2);
        html = `
          <div class="k24m-card">
            <div class="k24m-card-top">
              ${logoHtml(j, "k24m-logo")}
              <div class="k24m-card-head">
                <div class="k24m-title">${esc(j.title)}</div>
                <div class="k24m-sub">${esc(companyName(j))}</div>
              </div>
            </div>
            <div class="k24m-meta">📍 ${esc(placeLabel(j))}</div>
            ${j.salaryText ? `<div class="k24m-salary">💰 ${esc(j.salaryText)}</div>` : ""}
            ${benefits.length ? `<div class="k24m-chips">${benefits.map((b) => `<span>★ ${esc(b)}</span>`).join("")}</div>` : ""}
            <div class="k24m-actions">
              <button type="button" class="k24m-btn k24m-btn--ghost" data-open="${esc(j.id)}">Ansehen</button>
              <button type="button" class="k24m-btn" data-apply="${esc(j.id)}">Jetzt bewerben</button>
            </div>
          </div>`;
      } else {
        html = `
          <div class="k24m-card">
            <div class="k24m-place">📍 ${esc(placeLabel(first))}<span>${group.length} Stellen</span></div>
            <div class="k24m-rows">
              ${group
                .map(
                  (j) => `
                <button type="button" class="k24m-row" data-open="${esc(j.id)}">
                  ${logoHtml(j, "k24m-logo k24m-logo--sm")}
                  <span class="k24m-row-text">
                    <strong>${esc(j.title)}</strong>
                    <span>${esc(companyName(j))}</span>
                    ${j.salaryText ? `<em>💰 ${esc(j.salaryText)}</em>` : ""}
                  </span>
                  <span class="k24m-chev">›</span>
                </button>`
                )
                .join("")}
            </div>
          </div>`;
      }

      const popup = new maplibregl.Popup({ offset: 18, maxWidth: "320px", closeButton: true, className: "k24m-popup" })
        .setLngLat(lngLat)
        .setHTML(html)
        .addTo(map);
      const el = popup.getElement();
      el.querySelectorAll<HTMLElement>("[data-open]").forEach((b) => {
        b.onclick = () => navigate(`/jobs/${b.dataset.open}`);
      });
      el.querySelectorAll<HTMLElement>("[data-apply]").forEach((b) => {
        b.onclick = () => {
          const job = group.find((g) => g.id === b.dataset.apply);
          if (job && onApply) onApply(job);
        };
      });
      popup.on("close", () => setActiveKey((k) => (k === key ? null : k)));
      popupRef.current = popup;
      setActiveKey(key);
      if (fly) {
        userMovedRef.current = true;
        map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), 9), duration: 700 });
      }
    },
    [places, navigate, onApply]
  );

  // Aktuelle Funktionen für die Karten-Events bereithalten
  const updateVisibleRef = useRef(updateVisible);
  const openPlaceRef = useRef(openPlace);
  const setHoverRef = useRef(setHover);
  useEffect(() => {
    updateVisibleRef.current = updateVisible;
    openPlaceRef.current = openPlace;
    setHoverRef.current = setHover;
  }, [updateVisible, openPlace, setHover]);

  const fitToJobs = useCallback(
    (duration = 0) => {
      const map = mapRef.current;
      if (!map || !located.length) return;
      const b = new maplibregl.LngLatBounds();
      located.forEach((j) => b.extend([j.longitude!, j.latitude!]));
      map.fitBounds(b, { padding: 60, maxZoom: 11, duration });
    },
    [located]
  );
  const fitToJobsRef = useRef(fitToJobs);
  useEffect(() => {
    fitToJobsRef.current = fitToJobs;
  }, [fitToJobs]);

  // Karte aufbauen
  useEffect(() => {
    if (!supported || !containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URLS[themeRef.current],
      bounds: GERMANY,
      fitBoundsOptions: { padding: 24 },
      maxBounds: [
        [-2, 44],
        [24, 58],
      ],
      minZoom: 4.5,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Strg + Scrollen zum Zoomen der Karte",
        "CooperativeGesturesHandler.MacHelpText": "⌘ + Scrollen zum Zoomen der Karte",
        "CooperativeGesturesHandler.MobileHelpText": "Mit zwei Fingern die Karte bewegen",
        "NavigationControl.ZoomIn": "Hineinzoomen",
        "NavigationControl.ZoomOut": "Herauszoomen",
        "GeolocateControl.FindMyLocation": "Meinen Standort anzeigen",
        "FullscreenControl.Enter": "Vollbild",
        "FullscreenControl.Exit": "Vollbild beenden",
      },
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: false },
      fitBoundsOptions: { maxZoom: 9 },
    });
    geolocate.on("geolocate", () => (userMovedRef.current = true));
    map.addControl(geolocate, "bottom-right");
    map.addControl(new maplibregl.FullscreenControl(), "bottom-right");

    // Nach jedem (Neu-)Laden des Stils: Grundfarben + Stellen-Ebenen
    map.on("style.load", () => {
      applyBase(map, themeRef.current);
      if (dataRef.current) ensureJobLayers(map, themeRef.current, dataRef.current);
    });
    map.on("load", () => {
      // Quellenhinweis eingeklappt starten (Info-Symbol klappt ihn auf)
      containerRef.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      setLoaded(true);
    });

    // Klicks und Hover auf die Punkte (gelten auch nach Stilwechsel)
    for (const id of ["clusters", "points"]) {
      map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
    }
    map.on("click", "clusters", async (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
      if (!f) return;
      const source = map.getSource("jobs") as maplibregl.GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(f.properties!.cluster_id);
      userMovedRef.current = true;
      map.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom: zoom + 0.3, duration: 600 });
    });
    map.on("click", "points", (e) => {
      const f = e.features?.[0];
      if (f) openPlaceRef.current(f.properties!.key);
    });
    map.on("mousemove", "points", (e) => {
      const k = e.features?.[0]?.properties?.key;
      if (k && k !== hoveredRef.current) setHoverRef.current(k);
    });
    map.on("mouseleave", "points", () => setHoverRef.current(null));

    map.on("movestart", (e) => {
      if ((e as { originalEvent?: unknown }).originalEvent) userMovedRef.current = true;
    });
    map.on("moveend", () => updateVisibleRef.current());
    // Größe ändert sich (z. B. Scrollbalken) → solange niemand gezoomt hat, alle Stellen zeigen
    map.on("resize", () => {
      if (!userMovedRef.current) fitToJobsRef.current(0);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [supported]);

  // Daten setzen / aktualisieren
  useEffect(() => {
    dataRef.current = geojson as FeatureCollection;
    const map = mapRef.current;
    if (!map || !loaded) return;
    popupRef.current?.remove();
    const src = map.getSource("jobs") as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(geojson as FeatureCollection);
    else ensureJobLayers(map, themeRef.current, geojson as FeatureCollection);
    // Ausschnitt an die angezeigten Stellen anpassen (z. B. nach Ortssuche)
    userMovedRef.current = false;
    fitToJobs(0);
    updateVisible();
  }, [geojson, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hell / Dunkel umschalten
  useEffect(() => {
    themeRef.current = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* egal */
    }
    const map = mapRef.current;
    if (!map || !loaded || styleThemeRef.current === theme) return;
    styleThemeRef.current = theme;
    popupRef.current?.remove();
    hoveredRef.current = null;
    map.setStyle(STYLE_URLS[theme]);
  }, [theme, loaded]);

  // Sichtbare Stellen an die Liste unter der Karte melden
  useEffect(() => {
    if (!onVisibleChange) return;
    if (!visibleKeys) {
      onVisibleChange(null); // alles sichtbar → keine Einschränkung (auch Stellen ohne Koordinaten)
      return;
    }
    const ids = new Set<string>();
    for (const k of visibleKeys) for (const j of places.get(k) || []) ids.add(j.id);
    onVisibleChange(ids);
  }, [visibleKeys, places, onVisibleChange]);

  const resetView = useCallback(() => {
    popupRef.current?.remove();
    userMovedRef.current = false;
    mapRef.current?.fitBounds(GERMANY, { padding: 24, duration: 800 });
  }, []);

  useEffect(() => {
    if (resetSignal > 0) resetView();
  }, [resetSignal, resetView]);

  return (
    <div>
      {/* Karte */}
      <div className="relative h-[420px] md:h-[520px] rounded-2xl border border-border shadow-sm overflow-hidden transition-colors"
        style={{ background: PALETTE[theme].bg }}
      >
        <div ref={containerRef} className="k24m-map h-full w-full" />
        {!supported && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Ihr Browser kann die Kartenansicht leider nicht darstellen. Die Stellen finden Sie in der Liste.
          </div>
        )}
        <div className="absolute left-3 top-3 right-14 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
          <button
            type="button"
            onClick={resetView}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-background/95 backdrop-blur border border-border px-3.5 py-2 text-xs font-semibold text-foreground shadow-md hover:bg-background transition"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Ganz Deutschland
          </button>
          <div
            role="radiogroup"
            aria-label="Kartendarstellung"
            className="pointer-events-auto inline-flex items-center rounded-full bg-background/95 backdrop-blur border border-border p-0.5 shadow-md"
          >
            {([
              { v: "light", label: "Hell", Icon: Sun },
              { v: "dark", label: "Dunkel", Icon: Moon },
            ] as const).map(({ v, label, Icon }) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={theme === v}
                aria-label={`Karte ${label}`}
                title={`Karte ${label}`}
                onClick={() => setTheme(v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
                  theme === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute left-3 bottom-3 z-10 hidden sm:flex items-center gap-3 rounded-full bg-background/90 backdrop-blur border border-border px-3.5 py-1.5 text-[11px] text-muted-foreground shadow-sm">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: PALETTE[theme].fill }} />
            Region – klicken zum Zoomen
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-flex h-3 w-3 items-center justify-center rounded-full border-2 border-white shadow"
              style={{ background: PALETTE[theme].fill }}
            >
              <span className="h-1 w-1 rounded-full" style={{ background: PALETTE[theme].dot }} />
            </span>
            Kanzlei – klicken für Details
          </span>
        </div>
      </div>
    </div>
  );
}

export default JobMap;
