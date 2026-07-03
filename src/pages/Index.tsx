import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import VisualFeatureCards from "@/components/VisualFeatureCards";
import FeaturedJobs from "@/components/FeaturedJobs";
import FeatureCards from "@/components/FeatureCards";
import JobResults from "@/components/JobResults";
import WhyKanzleistelle from "@/components/WhyKanzleistelle";
import Footer from "@/components/Footer";
import NeeleContactDrawer from "@/components/NeeleContactDrawer";
import InitiativeApplyModal from "@/components/InitiativeApplyModal";
import GehaltsCheckModal from "@/components/GehaltsCheckModal";
import { Button } from "@/components/ui/button";
import { Briefcase, Building2, UserPlus, UserCheck, ArrowRight, Search, MapPin } from "lucide-react";
import { useJobsRealtime } from "@/hooks/useJobsRealtime";
import { useToast } from "@/hooks/use-toast";
import officeModernImage from "@/assets/office-modern.webp";

const Index = () => {
  useJobsRealtime();

  const { toast } = useToast();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [gehaltsCheckOpen, setGehaltsCheckOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("logout_success")) {
      sessionStorage.removeItem("logout_success");
      toast({ title: "Erfolgreich abgemeldet", description: "Bis bald! 👋" });
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchRadius, setSearchRadius] = useState('');

  const [appliedSearch, setAppliedSearch] = useState({ query: '', location: '', radius: '' });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">

        {/* Kombinierter Hero + Gehaltscheck */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${officeModernImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />

          <div className="container relative z-10">

            {/* OBERER TEIL — zentriert */}
            <div className="text-center max-w-4xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground mb-6">
                <Briefcase className="h-4 w-4" />
                Die Plattform für die Steuerbranche
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Der Treffpunkt für<br />
                Steuerexperten &amp; Kanzleien
              </h1>

              <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8">
                Ob Sie qualifizierte Fachkräfte suchen oder Ihre nächste
                Karrierechance — bei Kanzleistelle24 finden Sie zusammen.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button
                  size="lg"
                  className="bg-white text-primary font-bold hover:bg-white/90 h-12 px-8"
                  onClick={() => navigate("/fuer-arbeitgeber")}
                >
                  <Building2 className="h-5 w-5 mr-2" />
                  Als Kanzlei Talente finden
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white bg-white/10 hover:bg-white hover:text-primary font-bold h-12 px-8"
                  onClick={() => setApplyOpen(true)}
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Jetzt initiativ bewerben
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
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
            </div>

          </div>
        </section>

        {/* Suchleiste */}
        <section className="py-8 bg-white shadow-sm">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto">

              {/* Was */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Was suchst du? z.B. Steuerfachangestellte"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Ort */}
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="PLZ oder Ort"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Umkreis */}
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
                className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="">Umkreis</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>

              {/* Suchen Button */}
              <Button
                size="lg"
                className="bg-primary text-white font-bold px-8"
                onClick={() => {
                  document.getElementById('job-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setAppliedSearch({ query: searchQuery, location: searchLocation, radius: searchRadius });
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Suchen
              </Button>

            </div>
          </div>
        </section>

        {/* Zweispaltige Übersichts-Section */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Für Arbeitgeber */}
              <div className="flex flex-col bg-white rounded-2xl shadow-md border border-border/40 overflow-hidden">
                <div className="h-1 bg-primary" />
                <div className="flex flex-col flex-1 p-8">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-3">Für Steuerkanzleien</h2>
                  <p className="text-muted-foreground mb-4">
                    Finden Sie geprüfte Fachkräfte für Ihre Kanzlei — diskret, schnell und passgenau.
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground flex-1">
                    <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Geprüfte Kandidaten</li>
                    <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Branchenfokus Steuer</li>
                    <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Diskrete Suche</li>
                  </ul>
                  <button
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline mt-6 self-start"
                    onClick={() => navigate("/fuer-arbeitgeber")}
                  >
                    Mehr erfahren <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Für Bewerber */}
              <div className="flex flex-col bg-white rounded-2xl shadow-md border border-border/40 overflow-hidden">
                <div className="h-1 bg-primary/70" />
                <div className="flex flex-col flex-1 p-8">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <UserCheck className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-3">Für Steuerexperten</h2>
                  <p className="text-muted-foreground mb-4">
                    Entdecken Sie aktuelle Stellenangebote oder bewerben Sie sich initiativ bei
                    Top-Kanzleien in ganz Deutschland.
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground flex-1">
                    <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Express-Bewerbung in 30 Sek.</li>
                    <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Exklusive Stellen</li>
                    <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Kostenlos &amp; anonym</li>
                  </ul>
                  <Button
                    className="mt-6 self-start"
                    onClick={() => setApplyOpen(true)}
                  >
                    Jetzt initiativ bewerben <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <VisualFeatureCards onScrollToJobs={() => {
          const resultsSection = document.getElementById("job-results");
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: "smooth" });
          }
        }} />
        <FeaturedJobs
          searchQuery={appliedSearch.query}
          searchLocation={appliedSearch.location}
          searchRadius={appliedSearch.radius}
        />
        <FeatureCards />

        <div id="job-results">
          <JobResults
            searchFilters={{
              title: appliedSearch.query || undefined,
              location: appliedSearch.location || undefined,
              radius: appliedSearch.radius ? Number(appliedSearch.radius) : undefined,
            }}
            initialTitle={appliedSearch.query}
            initialLocation={appliedSearch.location}
          />
        </div>

        <WhyKanzleistelle />
      </main>

      <Footer />
      <NeeleContactDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <InitiativeApplyModal open={applyOpen} onOpenChange={setApplyOpen} />
      <GehaltsCheckModal open={gehaltsCheckOpen} onOpenChange={setGehaltsCheckOpen} />
    </div>
  );
};

export default Index;
