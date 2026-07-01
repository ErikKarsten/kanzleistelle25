import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NeeleContactDrawer from "@/components/NeeleContactDrawer";
import { supabase } from "@/lib/supabase";
import {
  Users,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  Building2,
  Briefcase,
  AlertTriangle,
  Zap,
  Search,
  Target,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react";
import officeModernImage from "@/assets/office-modern.webp";
import partnershipImage from "@/assets/partnership-handshake.webp";
import plzCoords from "@/data/plz-coords.json";

const taxJobs = [
  "Steuerfachangestellte",
  "Lohnbuchhalter",
  "Bilanzbuchhalter",
  "Steuererklarant",
  "Syndikussteuerberater",
  "Steuerberater",
  "Sonstige",
];

const painPoints = [
  {
    icon: AlertTriangle,
    title: "Fachkräftemangel",
    description: "Die Steuerbranche leidet unter einem massiven Fachkräftemangel. Qualifizierte Bewerber sind rar.",
  },
  {
    icon: Clock,
    title: "Zeitaufwändige Suche",
    description: "Traditionelle Recruiting-Methoden kosten Zeit und Ressourcen, die in der Mandantenarbeit fehlen.",
  },
  {
    icon: Users,
    title: "Hohe Fluktuation",
    description: "Unpassende Einstellungen führen zu teuren Fehlbesetzungen und hoher Mitarbeiterfluktuation.",
  },
];

const solutions = [
  {
    icon: Building2,
    title: "Branchenfokus Steuer",
    description: "Wir sind auf die Steuerbranche spezialisiert und verstehen Ihre Anforderungen.",
  },
  {
    icon: Award,
    title: "Geprüfte Kandidaten",
    description: "Jeder Kandidat wird persönlich geprüft und auf Ihre Kanzleikultur abgestimmt.",
  },
  {
    icon: TrendingUp,
    title: "Schnelle Besetzung",
    description: "Unser Express-Prozess liefert passende Kandidaten in kürzester Zeit.",
  },
];

const processSteps = [
  {
    number: "01",
    icon: Target,
    title: "Anforderungsprofil",
    description: "Wir analysieren Ihre Anforderungen und erstellen ein präzises Stellenprofil.",
  },
  {
    number: "02",
    icon: Search,
    title: "Active Sourcing",
    description: "Unser Team durchsucht aktiv unseren Talentpool und spricht passende Kandidaten an.",
  },
  {
    number: "03",
    icon: Filter,
    title: "Vorqualifizierung",
    description: "Jeder Kandidat wird persönlich geprüft – fachlich und kulturell abgestimmt.",
  },
  {
    number: "04",
    icon: Users,
    title: "Kandidatenpräsentation",
    description: "Sie erhalten handverlesene Kandidaten mit detaillierten Profilen.",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Zeit sparen",
    description: "Keine endlosen Bewerbungsstapel. Wir liefern vorqualifizierte Kandidaten.",
  },
  {
    icon: Award,
    title: "Qualität garantiert",
    description: "Jeder Kandidat wird persönlich geprüft und auf Ihre Kanzlei abgestimmt.",
  },
  {
    icon: Building2,
    title: "Employer Branding",
    description: "Präsentieren Sie Ihre Kanzlei optimal und gewinnen Sie Top-Talente.",
  },
  {
    icon: Zap,
    title: "Express-Besetzung",
    description: "Schnelle Prozesse für dringende Vakanzen in Ihrer Kanzlei.",
  },
];

let lastNominatimCall = 0;

async function geocodeQuery(query: string): Promise<{ lat: number; lon: number; postcode?: string } | null> {
  const key = `gc_${query.toLowerCase().replace(/\s+/g, "_")}`;
  const cached = sessionStorage.getItem(key);
  if (cached !== null) return cached === "null" ? null : JSON.parse(cached);

  const delay = Math.max(0, 1100 - (Date.now() - lastNominatimCall));
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  lastNominatimCall = Date.now();

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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isEchterOrt(location: string): boolean {
  if (!location) return false;
  const text = location.trim().toLowerCase();
  if (!text) return false;
  if (text.includes("deutschlandweit")) return false;
  if (/^\d+$/.test(text)) return false;
  return true;
}

function getDisplayLocation(
  candidate: Candidate,
  locationCoords: Record<string, { lat: number; lon: number; postcode?: string } | null>
): string {
  const hasValidPlz = /^\d{5}$/.test(candidate.postal_code);
  if (hasValidPlz) return candidate.location;
  const geocoded = locationCoords[candidate.id];
  if (geocoded?.postcode) {
    return `${geocoded.postcode} ${candidate.location}`;
  }
  return candidate.location;
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  postal_code: string;
  position: string;
  experience_years: number;
  is_archived: boolean;
}

const FuerArbeitgeber = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [radiusFilter, setRadiusFilter] = useState<number | "">("");
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [candidateCoords, setCandidateCoords] = useState<Record<string, { lat: number; lon: number } | null>>({});
  const [candidateLocationCoords, setCandidateLocationCoords] = useState<Record<string, { lat: number; lon: number; postcode?: string } | null>>({});
  const [pageLimit, setPageLimit] = useState<number | null>(20);
  const candidateListRef = useRef<HTMLDivElement>(null);

  // Lade Kandidaten von Supabase
  useEffect(() => {
    if (import.meta.env.VITE_SHOW_CANDIDATES !== "true") return;
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔄 Starte Kandidaten-Abfrage...");

        const { data, error: fetchError } = await supabase
          .from("applications")
          .select("id, first_name, last_name, email, phone, location, postal_code, position, experience_years, is_archived")
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
          .limit(100);

        if (fetchError) {
          console.error("❌ Supabase Fehler:", fetchError);
          setError(`Fehler beim Laden der Kandidaten: ${fetchError.message}`);
          setCandidates([]);
          return;
        }

        console.log("✅ Kandidaten erfolgreich geladen:", data?.length || 0);
        console.log("📋 Kandidaten-Daten:", data);
        setCandidates(data || []);
      } catch (err) {
        console.error("❌ Exception beim Laden:", err);
        setError("Ein unerwarteter Fehler ist aufgetreten");
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Geocode Suchstandort wenn locationFilter sich ändert
  useEffect(() => {
    if (!locationFilter.trim()) {
      setSearchCoords(null);
      return;
    }
    const timer = setTimeout(async () => {
      const coords = await geocodeQuery(locationFilter.trim());
      setSearchCoords(coords);
    }, 600);
    return () => clearTimeout(timer);
  }, [locationFilter]);

  // Kandidaten-PLZs synchron aus lokaler Tabelle auflösen
  useEffect(() => {
    if (candidates.length === 0) return;
    const coordsMap: Record<string, { lat: number; lon: number } | null> = {};
    for (const c of candidates) {
      const plz = c.postal_code;
      if (!/^\d{5}$/.test(plz)) continue;
      const entry = (plzCoords as Record<string, [number, number]>)[plz];
      coordsMap[plz] = entry ? { lat: entry[0], lon: entry[1] } : null;
    }
    setCandidateCoords(coordsMap);
  }, [candidates]);

  // Kandidaten ohne gültige PLZ, aber mit echtem Ortsnamen per Nominatim geocoden
  useEffect(() => {
    const kandidatenOhnePlz = candidates.filter(
      (c) => !/^\d{5}$/.test(c.postal_code) && isEchterOrt(c.location)
    );
    if (kandidatenOhnePlz.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const c of kandidatenOhnePlz) {
        if (cancelled) break;
        const coords = await geocodeQuery(c.location.trim());
        if (!cancelled) {
          setCandidateLocationCoords((prev) => ({ ...prev, [c.id]: coords }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [candidates]);

  const limitOptions: Array<{ label: string; value: number | null }> = [
    { label: "10", value: 10 },
    { label: "20", value: 20 },
    { label: "50", value: 50 },
    { label: "Alle", value: null },
  ];

  // Filter Kandidaten
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesPosition = !positionFilter || candidate.position.includes(positionFilter);

    const matchesExperience =
      !experienceFilter ||
      (experienceFilter === "junior" && candidate.experience_years < 2) ||
      (experienceFilter === "mid" && candidate.experience_years >= 2 && candidate.experience_years < 5) ||
      (experienceFilter === "senior" && candidate.experience_years >= 5);

    let matchesLocation = true;
    if (locationFilter.trim() && radiusFilter !== "" && searchCoords) {
      const hasValidPlz = /^\d{5}$/.test(candidate.postal_code);
      if (hasValidPlz) {
        const coords = candidateCoords[candidate.postal_code];
        if (coords) {
          matchesLocation = haversineKm(searchCoords.lat, searchCoords.lon, coords.lat, coords.lon) <= (radiusFilter as number);
        }
        // Koordinaten noch nicht geladen → standardmäßig einschließen
      } else if (isEchterOrt(candidate.location)) {
        const coords = candidateLocationCoords[candidate.id];
        if (coords) {
          matchesLocation = haversineKm(searchCoords.lat, searchCoords.lon, coords.lat, coords.lon) <= (radiusFilter as number);
        }
        // Koordinaten noch nicht geladen -> standardmäßig einschließen (wie bisher)
      }
      // Kandidaten OHNE PLZ und OHNE echten Ortsnamen (also wirklich "Deutschlandweit")
      // werden weiterhin immer durchgelassen
    }

    return matchesPosition && matchesExperience && matchesLocation;
  })
  .sort((a, b) => {
    const aIsLocal = /^\d{5}$/.test(a.postal_code) || isEchterOrt(a.location);
    const bIsLocal = /^\d{5}$/.test(b.postal_code) || isEchterOrt(b.location);
    if (aIsLocal === bIsLocal) return 0;
    return aIsLocal ? -1 : 1;
  });

  const displayedCandidates = pageLimit ? filteredCandidates.slice(0, pageLimit) : filteredCandidates;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Recruiting für Steuerkanzleien | Kanzleistelle24</title>
      </Helmet>
      <Header />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative py-20 md:py-32">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${officeModernImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />
          
          <div className="container relative z-10">
            <div className="max-w-3xl mb-12">
              <div className="text-primary-foreground">
                <div className="inline-flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Briefcase className="h-4 w-4" />
                  Für Steuerkanzleien
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Finden Sie die besten Talente für Ihre Kanzlei
                </h1>
                <p className="text-lg opacity-90 mb-8 max-w-2xl">
                  Der Fachkräftemangel in der Steuerberatung ist real. Wir helfen Ihnen, 
                  qualifizierte Mitarbeiter zu finden – schnell, diskret und passgenau.
                </p>
                <Button 
                  size="lg" 
                  className="bg-background text-primary font-bold rounded-md shadow-sm hover:bg-background/90 h-12 px-8"
                  onClick={() => setDrawerOpen(true)}
                >
                  Jetzt anfragen
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mb-12">
              <div className="bg-background/20 backdrop-blur-sm p-4 rounded-lg border border-background/30">
                <div className="text-2xl font-bold text-primary-foreground">30 Sek.</div>
                <div className="text-xs text-primary-foreground/80">Express-Bewerbung</div>
              </div>
              <div className="bg-background/20 backdrop-blur-sm p-4 rounded-lg border border-background/30">
                <div className="text-2xl font-bold text-primary-foreground">24h</div>
                <div className="text-xs text-primary-foreground/80">Erste Rückmeldung</div>
              </div>
              <div className="bg-background/20 backdrop-blur-sm p-4 rounded-lg border border-background/30">
                <div className="text-2xl font-bold text-primary-foreground">100%</div>
                <div className="text-xs text-primary-foreground/80">Branchenfokus</div>
              </div>
              <div className="bg-background/20 backdrop-blur-sm p-4 rounded-lg border border-background/30">
                <div className="text-2xl font-bold text-primary-foreground">✓</div>
                <div className="text-xs text-primary-foreground/80">Geprüft</div>
              </div>
            </div>

            {/* SUCHMASKE – temporär ausgeblendet */}
          </div>
        </section>

        {/* KANDIDATEN-LISTE – temporär ausgeblendet */}

        {/* TABS */}
        <section className="py-20 container">
          <Tabs defaultValue="problem">
            <TabsList className="grid w-full grid-cols-3 mb-12">
              <TabsTrigger value="problem">Das Problem</TabsTrigger>
              <TabsTrigger value="loesung">Unsere Lösung</TabsTrigger>
              <TabsTrigger value="prozess">Recruiting-Prozess</TabsTrigger>
            </TabsList>

            <TabsContent value="problem">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Die Herausforderungen kennen wir</h2>
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {painPoints.map((p, i) => (
                  <Card key={i} className="border-0 shadow-lg">
                    <CardContent className="pt-8">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <p.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-3">{p.title}</h3>
                      <p className="text-muted-foreground">{p.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="loesung">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Warum wir die Lösung sind</h2>
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {solutions.map((s, i) => (
                  <Card key={i} className="border-0 shadow-lg">
                    <CardContent className="pt-8">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <s.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-3">{s.title}</h3>
                      <p className="text-muted-foreground">{s.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="prozess">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Unser Recruiting-Prozess</h2>
              </div>
              <div className="grid gap-8 md:grid-cols-4">
                {processSteps.map((s, i) => (
                  <Card key={i} className="border-0 shadow-lg">
                    <CardContent className="pt-8 pb-6">
                      <div className="text-6xl font-black text-primary/10">{s.number}</div>
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                        <s.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-3">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* BENEFITS */}
        <section className="py-20 bg-secondary/20">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-8">Das bringt Ihnen Kanzleistelle24</h2>
                <div className="space-y-6">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <b.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">{b.title}</h3>
                        <p className="text-sm text-muted-foreground">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <img src={partnershipImage} alt="Partner" className="rounded-2xl shadow-2xl" />
            </div>
          </div>
        </section>
      </main>

      <NeeleContactDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <Footer />
    </div>
  );
};

export default FuerArbeitgeber;