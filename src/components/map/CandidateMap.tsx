import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Candidate {
  id: string;
  lat: number;
  lon: number;
  region: string;
  count: number;
  city: string;
}

const TEST_CANDIDATES: Candidate[] = [
  { id: "1", lat: 48.1351, lon: 11.5819, region: "Bayern", count: 23, city: "München" },
  { id: "2", lat: 52.52, lon: 13.405, region: "Berlin", count: 15, city: "Berlin" },
  { id: "3", lat: 53.55, lon: 9.9917, region: "Hamburg", count: 12, city: "Hamburg" },
  { id: "4", lat: 50.9365, lon: 6.9589, region: "NRW", count: 18, city: "Köln" },
  { id: "5", lat: 51.4556, lon: 7.0116, region: "NRW", count: 14, city: "Essen" },
  { id: "6", lat: 50.1109, lon: 8.6821, region: "Hessen", count: 19, city: "Frankfurt" },
  { id: "7", lat: 51.3397, lon: 12.3731, region: "Sachsen", count: 11, city: "Leipzig" },
  { id: "8", lat: 51.0504, lon: 13.7373, region: "Sachsen", count: 9, city: "Dresden" },
  { id: "9", lat: 48.7758, lon: 9.1829, region: "Baden-Württemberg", count: 16, city: "Stuttgart" },
  { id: "10", lat: 47.5596, lon: 7.5886, region: "Baden-Württemberg", count: 13, city: "Basel" },
];

export function CandidateMap({ candidates = TEST_CANDIDATES, selectedRegion }: any) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(candidates);

  useEffect(() => {
    let filtered = candidates;
    if (selectedRegion && selectedRegion !== "all") {
      filtered = filtered.filter((c) => c.region.toLowerCase() === selectedRegion.toLowerCase());
    }
    setFilteredCandidates(filtered);
  }, [candidates, selectedRegion]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    try {
      mapRef.current = L.map(mapContainerRef.current).setView([51.165, 10.452], 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    } catch (e) {
      console.error("Map init error:", e);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    try {
      mapRef.current.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) {
          mapRef.current?.removeLayer(layer);
        }
      });

      filteredCandidates.forEach((candidate) => {
        const marker = L.circleMarker([candidate.lat, candidate.lon], {
          radius: 10,
          fillColor: "#ff7800",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        });
        marker.bindPopup(`<strong>${candidate.count} Kandidaten</strong><br/>${candidate.city}`);
        marker.addTo(mapRef.current!);
      });
    } catch (e) {
      console.error("Marker error:", e);
    }
  }, [filteredCandidates]);

  const totalCandidates = filteredCandidates.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-4">
      <div ref={mapContainerRef} className="w-full h-[600px] rounded-lg border border-border shadow-lg bg-muted" />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-secondary rounded-lg">
          <p className="text-muted-foreground">Kandidaten</p>
          <p className="text-2xl font-bold">{totalCandidates}</p>
        </div>
        <div className="p-3 bg-secondary rounded-lg">
          <p className="text-muted-foreground">Orte</p>
          <p className="text-2xl font-bold">{filteredCandidates.length}</p>
        </div>
      </div>
    </div>
  );
}
