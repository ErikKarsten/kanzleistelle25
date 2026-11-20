import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { Maximize2 } from "lucide-react";

export interface MapJob {
  id: string;
  title: string;
  company: string;
  postal_code: string | null;
  city: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  salaryText?: string | null;
  companies?: { name: string; logo_url: string | null } | null;
}

interface Props {
  jobs: MapJob[];
}

const GERMANY_BOUNDS: L.LatLngBoundsExpression = [
  [47.2, 5.8],
  [55.1, 15.1],
];

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const placeLabel = (j: MapJob) =>
  j.postal_code && j.city ? `${j.postal_code} ${j.city}` : j.location || j.city || "";

const pinIcon = (count: number) =>
  L.divIcon({
    className: "k24-pin-wrap",
    html: `<div class="k24-pin">${count > 1 ? count : ""}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });

const JobMap = ({ jobs }: Props) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  // Stellen am gleichen Ort zu einem Punkt zusammenfassen
  const places = useMemo(() => {
    const groups = new Map<string, MapJob[]>();
    for (const j of jobs) {
      if (j.latitude == null || j.longitude == null) continue;
      const key = `${j.latitude.toFixed(3)},${j.longitude.toFixed(3)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(j);
    }
    return [...groups.values()];
  }, [jobs]);

  const jobsOnMap = places.reduce((n, p) => n + p.length, 0);

  // Karte einmalig aufbauen
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!containerRef.current || mapRef.current) return;
      (window as any).L = L;
      await import("leaflet.markercluster");
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomSnap: 0.25,
        minZoom: 5,
        maxBounds: [
          [45.5, 2.5],
          [56.5, 18.5],
        ],
        zoomControl: true,
      });
      map.fitBounds(GERMANY_BOUNDS, { animate: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
        maxZoom: 18,
      }).addTo(map);

      // Mausrad-Zoom erst nach Klick in die Karte, damit die Seite normal scrollt
      map.on("click", () => map.scrollWheelZoom.enable());
      map.on("mouseout", () => map.scrollWheelZoom.disable());

      // Klick auf eine Stelle im Popup öffnet die Stellenanzeige
      map.on("popupopen", (e: any) => {
        const el: HTMLElement | undefined = e.popup?.getElement?.();
        el?.querySelectorAll<HTMLElement>("[data-job-id]").forEach((btn) => {
          btn.onclick = (ev) => {
            ev.preventDefault();
            navigate(`/jobs/${btn.dataset.jobId}`);
          };
        });
      });

      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [navigate]);

  // Punkte setzen, wenn sich die Stellen (z. B. durch Filter) ändern
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (clusterRef.current) map.removeLayer(clusterRef.current);

    const cluster = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 45,
      iconCreateFunction: (c: any) => {
        const total = c.getAllChildMarkers().reduce((n: number, m: any) => n + (m.options.jobCount || 1), 0);
        const size = total >= 20 ? 52 : total >= 10 ? 46 : 40;
        return L.divIcon({
          className: "k24-pin-wrap",
          html: `<div class="k24-cluster" style="width:${size}px;height:${size}px">${total}</div>`,
          iconSize: [size, size],
        });
      },
    }) as L.LayerGroup;

    for (const group of places) {
      const first = group[0];
      const items = group
        .map(
          (j) => `
          <button type="button" class="k24-pop-job" data-job-id="${esc(j.id)}">
            ${
              j.companies?.logo_url
                ? `<img src="${esc(j.companies.logo_url)}" alt="" class="k24-pop-logo" />`
                : `<span class="k24-pop-logo k24-pop-logo--empty">${esc((j.companies?.name || j.company).slice(0, 2).toUpperCase())}</span>`
            }
            <span class="k24-pop-text">
              <strong>${esc(j.title)}</strong>
              <span>${esc(j.companies?.name || j.company)}</span>
              ${j.salaryText ? `<em>💰 ${esc(j.salaryText)}</em>` : ""}
            </span>
            <span class="k24-pop-arrow">›</span>
          </button>`
        )
        .join("");
      const html = `
        <div class="k24-pop">
          <div class="k24-pop-head">📍 ${esc(placeLabel(first))} · ${group.length} ${group.length === 1 ? "Stelle" : "Stellen"}</div>
          <div class="k24-pop-list">${items}</div>
        </div>`;
      const marker = L.marker([first.latitude!, first.longitude!], {
        icon: pinIcon(group.length),
        jobCount: group.length,
        title: `${placeLabel(first)}: ${group.length} ${group.length === 1 ? "Stelle" : "Stellen"}`,
      } as any);
      marker.bindPopup(html, { maxWidth: 320, minWidth: 260, autoPanPadding: [20, 20] });
      cluster.addLayer(marker);
    }

    cluster.addTo(map);
    clusterRef.current = cluster;

    // Auf die angezeigten Stellen zoomen (z. B. nach einer Ortssuche)
    if (places.length) {
      const bounds = L.latLngBounds(places.map((g) => [g[0].latitude!, g[0].longitude!] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11, animate: false });
    }
  }, [places, ready]);

  const resetView = () => mapRef.current?.fitBounds(GERMANY_BOUNDS);

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={containerRef}
          className="k24-map w-full h-[460px] md:h-[600px] rounded-xl border border-border shadow-sm bg-muted overflow-hidden"
        />
        <button
          type="button"
          onClick={resetView}
          className="absolute top-3 right-3 z-[500] inline-flex items-center gap-1.5 rounded-lg bg-background/95 border border-border px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-background"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Ganz Deutschland
        </button>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        <span className="font-semibold text-foreground">{jobsOnMap}</span> Stellen auf der Karte · Auf eine Zahl klicken
        zum Hineinzoomen, auf einen Punkt klicken für die Stellen vor Ort
      </p>
    </div>
  );
};

export default JobMap;
