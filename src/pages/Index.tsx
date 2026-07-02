import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VisualFeatureCards from "@/components/VisualFeatureCards";
import FeaturedJobs from "@/components/FeaturedJobs";
import FeatureCards from "@/components/FeatureCards";
import JobResults from "@/components/JobResults";
import WhyKanzleistelle from "@/components/WhyKanzleistelle";
import Footer from "@/components/Footer";
import NeeleContactDrawer from "@/components/NeeleContactDrawer";
import InitiativeApplyModal from "@/components/InitiativeApplyModal";
import { Button } from "@/components/ui/button";
import { Building2, UserCheck, ArrowRight } from "lucide-react";
import { useJobsRealtime } from "@/hooks/useJobsRealtime";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  useJobsRealtime();

  const { toast } = useToast();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("logout_success")) {
      sessionStorage.removeItem("logout_success");
      toast({ title: "Erfolgreich abgemeldet", description: "Bis bald! 👋" });
    }
  }, []);

  const [searchFilters, setSearchFilters] = useState<{
    title?: string;
    location?: string;
    radius?: number;
  }>({});

  const handleSearch = (filters: { title: string; location: string; radius?: number }) => {
    setSearchFilters({
      title: filters.title || undefined,
      location: filters.location || undefined,
      radius: filters.radius,
    });
    const resultsSection = document.getElementById("job-results");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroSection onContactClick={() => setDrawerOpen(true)} onApplyClick={() => setApplyOpen(true)} />

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
        <FeaturedJobs />
        <FeatureCards />

        <div id="job-results">
          <JobResults searchFilters={searchFilters} />
        </div>

        <WhyKanzleistelle />
      </main>

      <Footer />
      <NeeleContactDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <InitiativeApplyModal open={applyOpen} onOpenChange={setApplyOpen} />
    </div>
  );
};

export default Index;
