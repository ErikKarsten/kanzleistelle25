import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import VisualFeatureCards from "@/components/VisualFeatureCards";
import JobResults from "@/components/JobResults";
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

  const [stickyQuery, setStickyQuery] = useState('');
  const [stickyLocation, setStickyLocation] = useState('');
  const [stickyRadius, setStickyRadius] = useState('');
  const [audienceTab, setAudienceTab] = useState<'bewerber' | 'kanzlei'>('bewerber');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [gehaltsCheckOpen, setGehaltsCheckOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("logout_success")) {
      sessionStorage.removeItem("logout_success");
      toast({ title: "Erfolgreich abgemeldet", description: "Bis bald! 👋" });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">

        {/* Hero + Gehaltscheck */}
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

            {/* UNTERER TEIL — Gehaltscheck */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  💰 Was verdienen Sie wirklich?
                </h2>
                <p className="text-white/80 text-lg max-w-lg mb-4">
                  Unser Gehaltscheck zeigt Ihnen in 60 Sekunden, was
                  Steuerfachkräfte in Ihrem Bundesland tatsächlich verdienen.
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-white/70">
                  <span>✓ 16 Bundesländer</span>
                  <span>✓ 3 Erfahrungsstufen</span>
                  <span>✓ Echte Gehaltsdaten</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 text-center min-w-[280px] shadow-2xl shrink-0">
                <p className="text-primary font-bold text-lg mb-1">
                  Ihr Gehalts-Ergebnis
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  Steuerfachangestellte · Bilanzbuchhalter · Steuerberater
                </p>
                <Button
                  size="lg"
                  className="w-full bg-primary text-white font-bold h-12"
                  onClick={() => setGehaltsCheckOpen(true)}
                >
                  Jetzt Gehalt checken →
                </Button>
                <p className="text-muted-foreground text-xs mt-3">
                  Kostenlos · Anonym · In 60 Sekunden
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Suchleiste */}
        <section className="py-6 bg-white border-b">
          <div className="container">
            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
              <div className="flex-1 relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Jobtitel, z.B. Steuerfachangestellte..."
                  value={stickyQuery}
                  onChange={(e) => setStickyQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Stadt oder Region..."
                  value={stickyLocation}
                  onChange={(e) => setStickyLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={stickyRadius}
                onChange={(e) => setStickyRadius(e.target.value)}
                className="px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white text-muted-foreground"
              >
                <option value="">Umkreis</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>
              <Button
                onClick={() => {
                  document.getElementById('stellenangebote')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="bg-primary text-white px-6"
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

        <VisualFeatureCards onScrollToJobs={() => {}} />

        {/* Warum Kanzleistelle24 — Tab Switch */}
        <section className="py-16 bg-secondary/10">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                {audienceTab === 'bewerber'
                  ? 'Warum als Bewerber zu Kanzleistelle24?'
                  : 'Warum als Kanzlei mit uns arbeiten?'}
              </h2>
              <div className="flex justify-center">
                <div className="inline-flex bg-secondary/30 rounded-full p-1">
                  <button
                    onClick={() => setAudienceTab('bewerber')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      audienceTab === 'bewerber'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    👤 Für Bewerber
                  </button>
                  <button
                    onClick={() => setAudienceTab('kanzlei')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      audienceTab === 'kanzlei'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🏢 Für Kanzleien
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Tab: Für Bewerber */}
              <div className={`transition-opacity duration-200 ${
                audienceTab === 'bewerber' ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { emoji: '⚡', title: 'Express-Bewerbung', desc: 'Bewerben Sie sich in nur 30 Sekunden – ohne Lebenslauf, ohne Anschreiben.', highlight: true },
                    { emoji: '🧮', title: 'DATEV-Expertise', desc: 'Finden Sie Positionen, die Ihre DATEV-Kenntnisse wertschätzen und fördern.' },
                    { emoji: '🏆', title: 'Top Steuerkanzleien', desc: 'Zugang zu exklusiven Stellenangeboten führender Kanzleien mit moderner Kanzleikultur.' },
                    { emoji: '🤝', title: 'Mandantenbetreuung', desc: 'Entdecken Sie Positionen mit direktem Mandantenkontakt und Entwicklungsperspektiven.' },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className={`rounded-xl border-2 p-6 text-center transition-shadow hover:shadow-md ${
                        card.highlight ? 'border-primary bg-primary/5' : 'border-border bg-white'
                      }`}
                    >
                      <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl ${
                        card.highlight ? 'bg-primary' : 'bg-primary/10'
                      }`}>
                        {card.emoji}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab: Für Kanzleien */}
              <div className={`transition-opacity duration-200 ${
                audienceTab === 'kanzlei' ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { emoji: '🎯', title: 'Geprüfte Kandidaten', desc: 'Nur vorqualifizierte Fachkräfte die wirklich passen.' },
                    { emoji: '⚡', title: 'Schnelle Besetzung', desc: 'Erste Kandidatenvorschläge innerhalb von 24 Stunden.' },
                    { emoji: '💼', title: 'Branchenfokus', desc: 'Wir kennen die Steuerbranche und ihre Anforderungen genau.' },
                    { emoji: '🔒', title: 'Diskrete Suche', desc: 'Ihre Suche bleibt vertraulich — auch vor dem eigenen Team.' },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="rounded-xl border-2 border-border bg-white p-6 text-center transition-shadow hover:shadow-md"
                    >
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-2xl">
                        {card.emoji}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-10">
                  <Button
                    size="lg"
                    onClick={() => navigate('/fuer-arbeitgeber')}
                    className="px-8"
                  >
                    Jetzt als Kanzlei anfragen <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div id="stellenangebote">
          <JobResults searchFilters={{}} />
        </div>
      </main>

      <Footer />
      <NeeleContactDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <InitiativeApplyModal open={applyOpen} onOpenChange={setApplyOpen} />
      <GehaltsCheckModal open={gehaltsCheckOpen} onOpenChange={setGehaltsCheckOpen} />
    </div>
  );
};

export default Index;
