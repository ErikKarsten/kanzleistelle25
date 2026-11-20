import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Maximize2, Send, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const GERMANY: [[number, number], [number, number]] = [
  [5.8, 47.25],
  [15.1, 55.1],
];
const NAVY = "#003366";
const GOLD = "#f2b90d";

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

function JobMap<T extends MapJob>({ jobs, onApply }: Props<T>) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string> | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
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
    const b = map.getBounds();
    const keys = new Set<string>();
    for (const [k, g] of places) {
      if (b.contains([g[0].longitude!, g[0].latitude!])) keys.add(k);
    }
    setVisibleKeys(keys);
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
      if (fly) map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), 9), duration: 700 });
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

  // Karte aufbauen
  useEffect(() => {
    if (!supported || !containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
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
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: false }, fitBoundsOptions: { maxZoom: 9 } }),
      "bottom-right"
    );
    map.addControl(new maplibregl.FullscreenControl(), "bottom-right");

    map.on("load", () => {
      // Kartenstil: ruhige, helle Farben und deutsche Ortsnamen
      try {
        map.setPaintProperty("background", "background-color", "#f7f7f4");
        map.setPaintProperty("water", "fill-color", "#d5e3ef");
        for (const layer of map.getStyle().layers || []) {
          if (layer.type === "symbol" && (layer.layout as any)?.["text-field"]) {
            map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name:de"], ["get", "name_int"], ["get", "name"]]);
          }
        }
      } catch {
        /* Stil bleibt Standard */
      }
      // Quellenhinweis eingeklappt starten (Info-Symbol klappt ihn auf)
      containerRef.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      setLoaded(true);
    });
    map.on("moveend", () => updateVisibleRef.current());
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [supported]);

  // Daten und Ebenen setzen / aktualisieren
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    popupRef.current?.remove();
    const src = map.getSource("jobs") as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(geojson as any);
    } else {
      map.addSource("jobs", {
        type: "geojson",
        data: geojson as any,
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
          "circle-color": NAVY,
          "circle-opacity": 0.16,
          "circle-radius": ["step", ["get", "jobs"], 26, 5, 31, 15, 38],
        },
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "jobs",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": NAVY,
          "circle-radius": ["step", ["get", "jobs"], 18, 5, 22, 15, 27],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "jobs",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["to-string", ["get", "jobs"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": 14,
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#ffffff" },
      });
      map.addLayer({
        id: "point-halo",
        type: "circle",
        source: "jobs",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": NAVY,
          "circle-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.28, 0.14],
          "circle-radius": ["case", ["boolean", ["feature-state", "hover"], false], 24, 19],
        },
      });
      map.addLayer({
        id: "points",
        type: "circle",
        source: "jobs",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": NAVY,
          "circle-radius": ["case", ["boolean", ["feature-state", "hover"], false], 15, 12],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "point-dot",
        type: "circle",
        source: "jobs",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "count"], 1]],
        paint: { "circle-color": GOLD, "circle-radius": 4.5 },
      });
      map.addLayer({
        id: "point-count",
        type: "symbol",
        source: "jobs",
        filter: ["all", ["!", ["has", "point_count"]], [">", ["get", "count"], 1]],
        layout: {
          "text-field": ["to-string", ["get", "count"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": 12,
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#ffffff" },
      });

      for (const id of ["clusters", "points"]) {
        map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
      }
      map.on("click", "clusters", async (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
        if (!f) return;
        const source = map.getSource("jobs") as maplibregl.GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(f.properties!.cluster_id);
        map.easeTo({ center: (f.geometry as any).coordinates, zoom: zoom + 0.3, duration: 600 });
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
    }

    // Ausschnitt an die angezeigten Stellen anpassen (z. B. nach Ortssuche)
    if (located.length) {
      const b = new maplibregl.LngLatBounds();
      located.forEach((j) => b.extend([j.longitude!, j.latitude!]));
      map.fitBounds(b, { padding: 60, maxZoom: 11, duration: 0 });
    }
    updateVisible();
  }, [geojson, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Liste: Stellen im aktuellen Kartenausschnitt
  const listJobs = useMemo(() => {
    const out: { key: string; job: T }[] = [];
    for (const [k, g] of places) {
      if (visibleKeys && !visibleKeys.has(k)) continue;
      for (const j of g) out.push({ key: k, job: j });
    }
    return out;
  }, [places, visibleKeys]);

  const resetView = () => {
    popupRef.current?.remove();
    mapRef.current?.fitBounds(GERMANY, { padding: 24, duration: 800 });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_1fr]">
      {/* Liste der Stellen im Kartenausschnitt */}
      <aside className="order-2 lg:order-1 flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden lg:h-[640px]">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <p className="text-sm font-semibold text-foreground">
            {listJobs.length} {listJobs.length === 1 ? "Stelle" : "Stellen"} in diesem Kartenausschnitt
          </p>
          <p className="text-xs text-muted-foreground">Karte verschieben oder zoomen – die Liste passt sich an.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[420px] lg:max-h-none">
          {listJobs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10 px-4">
              In diesem Ausschnitt gibt es keine Stellen. Zoome heraus oder klicke auf „Ganz Deutschland“.
            </p>
          )}
          {listJobs.map(({ key, job }) => (
            <div
              key={job.id}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHover(key)}
              onMouseLeave={() => setHover(null)}
              onClick={() => openPlace(key, true)}
              onKeyDown={(e) => e.key === "Enter" && openPlace(key, true)}
              className={`group flex gap-3 rounded-xl p-3 cursor-pointer transition-colors border ${
                activeKey === key ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-secondary/60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-lg border border-border bg-white flex items-center justify-center overflow-hidden">
                    {job.companies?.logo_url ? (
                      <img src={job.companies.logo_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-primary">{companyName(job).slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {job.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{companyName(job)}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0 text-primary/70" />
                    <span className="truncate">{placeLabel(job)}</span>
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label="Stelle ansehen"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${job.id}`);
                      }}
                      className="inline-flex items-center rounded-md px-1.5 py-1 text-xs font-medium text-primary hover:bg-background"
                    >
                      <span className="hidden sm:inline">Ansehen</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    {onApply && (
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApply(job);
                        }}
                      >
                        <Send className="h-3 w-3" />
                        Bewerben
                      </Button>
                    )}
                  </div>
                </div>
                {(job.salaryText || (job.benefits && job.benefits.length > 0)) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {job.salaryText && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        💰 {job.salaryText}
                      </span>
                    )}
                    {(job.benefits || []).slice(0, job.salaryText ? 1 : 2).map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-[11px] text-foreground"
                      >
                        <Star className="h-2.5 w-2.5 text-featured fill-featured" />
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Karte */}
      <div className="order-1 lg:order-2 relative h-[460px] lg:h-[640px] rounded-2xl border border-border shadow-sm overflow-hidden bg-[#f7f7f4]">
        <div ref={containerRef} className="k24m-map h-full w-full" />
        {!supported && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Ihr Browser kann die Kartenansicht leider nicht darstellen. Die Stellen finden Sie in der Liste.
          </div>
        )}
        <button
          type="button"
          onClick={resetView}
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/95 backdrop-blur border border-border px-3.5 py-2 text-xs font-semibold text-foreground shadow-md hover:bg-background transition"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Ganz Deutschland
        </button>
        <div className="pointer-events-none absolute left-3 bottom-3 z-10 hidden sm:flex items-center gap-3 rounded-full bg-background/90 backdrop-blur border border-border px-3.5 py-1.5 text-[11px] text-muted-foreground shadow-sm">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: NAVY }} />
            Region – klicken zum Zoomen
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-flex h-3 w-3 items-center justify-center rounded-full border-2 border-white shadow"
              style={{ background: NAVY }}
            >
              <span className="h-1 w-1 rounded-full" style={{ background: GOLD }} />
            </span>
            Kanzlei – klicken für Details
          </span>
        </div>
      </div>
    </div>
  );
}

export default JobMap;
