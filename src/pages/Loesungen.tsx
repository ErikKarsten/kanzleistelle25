import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import NeeleContactDrawer from "@/components/NeeleContactDrawer";
import {
  Search,
  Filter,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  Building2,
  Target,
  Clock,
  Award,
} from "lucide-react";
import partnershipImage from "@/assets/partnership-handshake.webp";
import teamCollaborationImage from "@/assets/team-collaboration.webp";
import { Helmet } from "react-helmet-async";

const processSteps = [
  {
    number: "01",
    icon: Target,
    title: "Anforderungsprofil",
    description:
      "Wir analysieren Ihre Anforderungen und erstellen ein präzises Stellenprofil für die optimale Kandidatensuche.",
  },
  {
    number: "02",
    icon: Search,
    title: "Active Sourcing",
    description:
      "Unser Team durchsucht aktiv unseren Talentpool und spricht passende Kandidaten diskret an.",
  },
  {
    number: "03",
    icon: Filter,
    title: "Vorqualifizierung",
    description:
      "Jeder Kandidat wird von uns persönlich geprüft – fachlich und kulturell auf Ihre Kanzlei abgestimmt.",
  },
  {
    number: "04",
    icon: Users,
    title: "Kandidatenpräsentation",
    description:
      "Sie erhalten eine Auswahl handverlesener Kandidaten mit detaillierten Profilen und unserer Einschätzung.",
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

const Loesungen = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Recruiting-Lösungen für Steuerkanzleien | Kanzleistelle24</title>
        <meta
          name="description"
          content="Recruiting- und Personalvermittlungslösungen für Steuerkanzleien: Reverse Recruiting, Active Sourcing und Executive Search für Fach- und Führungskräfte."
        />
        <meta
          name="keywords"
          content="Personalvermittlung Kanzlei, Reverse Recruiting Steuer, Recruiting Lösungen Steuerkanzlei"
        />
      </Helmet>
      <Header />

      <main className="flex-1">
        {/* Hero Section with Image */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${teamCollaborationImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary/80" />
          <div className="container relative z-10">
            <div className="max-w-3xl text-primary-foreground">
              <span className="inline-block bg-background/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6">
                Recruiting-Lösungen
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Finden Sie die besten Talente für Ihre Kanzlei
              </h1>
              <p className="text-xl opacity-90 mb-8">
                Wir verstehen die Herausforderungen der Branche und liefern passende 
                Kandidaten für Ihre offenen Positionen – schnell, diskret und qualitätsgeprüft.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-background text-primary font-bold rounded-md shadow-sm hover:bg-background/90 text-lg h-13 px-8 w-full sm:w-auto"
                  onClick={() => setDrawerOpen(true)}
                >
                  Jetzt anfragen
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 container">
          <div className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">In 4 Schritten zum Erfolg</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              Unser Recruiting-Prozess
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
              Ein strukturierter Prozess für nachhaltige Besetzungen in der Steuerberatung.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={index} className="relative group">
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="pt-8 pb-6">
                    <div className="text-6xl font-black text-primary/10 absolute top-4 right-4">
                      {step.number}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <step.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section with Image */}
        <section className="py-20 bg-secondary/20">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-primary font-semibold text-sm uppercase tracking-wider">Warum Kanzleistelle24</span>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-8">
                  Ihre Vorteile
                </h2>
                <div className="space-y-6">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-background rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-1">
                          {benefit.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <img 
                  src={partnershipImage} 
                  alt="Erfolgreiche Partnerschaft" 
                  className="rounded-2xl shadow-2xl"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute -bottom-8 -right-8 bg-primary text-primary-foreground p-8 rounded-2xl shadow-xl hidden md:block">
                  <div className="text-4xl font-black">100%</div>
                  <div className="text-sm opacity-90">Branchenfokus</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Packages */}
        <section className="py-20 container">
          <div className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Passend für jeden Bedarf</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              Unsere Leistungen
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Link to="/fuer-arbeitgeber" className="group">
              <Card className="h-full border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-8 pb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stellenanzeige</h3>
                  <p className="text-muted-foreground mb-8">
                    Ihre Stelle auf unserer Plattform mit Reichweite in der Steuerbranche.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>30 Tage Laufzeit</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Express-Bewerbungen</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Bewerbermanagement</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            <Link to="/fuer-arbeitgeber" className="group">
              <Card className="h-full border-2 border-primary shadow-xl hover:shadow-2xl transition-all duration-300 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">
                    EMPFOHLEN
                  </span>
                </div>
                <CardContent className="pt-10 pb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Active Sourcing</h3>
                  <p className="text-muted-foreground mb-8">
                    Aktive Kandidatensuche durch unser Recruiting-Team.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Alle Stellenanzeigen-Features</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Direktansprache passender Kandidaten</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Persönliche Beratung</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            <Link to="/fuer-arbeitgeber" className="group">
              <Card className="h-full border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-8 pb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Executive Search</h3>
                  <p className="text-muted-foreground mb-8">
                    Diskrete Suche nach Führungskräften und Spezialisten.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Alle Active Sourcing-Features</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Exklusive Kandidatensuche</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Marktanalyse & Beratung</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </div>

        </section>
      </main>

      <NeeleContactDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <Footer />
    </div>
  );
};

export default Loesungen;
