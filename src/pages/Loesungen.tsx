import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-secondary/30 py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Recruiting-Lösungen für Steuerkanzleien
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Wir verstehen die Herausforderungen der Branche und liefern passende 
                Kandidaten für Ihre offenen Positionen – schnell, diskret und qualitätsgeprüft.
              </p>
              <Button size="lg" asChild>
                <Link to="/fuer-arbeitgeber">
                  Jetzt anfragen
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Unser Recruiting-Prozess
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ein strukturierter Prozess für nachhaltige Besetzungen in der Steuerberatung.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-8 pb-6">
                    <div className="text-4xl font-bold text-primary/20 mb-4">
                      {step.number}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-secondary/20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ihre Vorteile
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Warum Kanzleien mit uns zusammenarbeiten.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-8 pb-6">
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Service Packages */}
        <section className="py-16 container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Unsere Leistungen
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-2">
              <CardContent className="pt-8 pb-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Stellenanzeige</h3>
                <p className="text-muted-foreground mb-6">
                  Ihre Stelle auf unserer Plattform mit Reichweite in der Steuerbranche.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    30 Tage Laufzeit
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Express-Bewerbungen
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Bewerbermanagement
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary ring-2 ring-primary/20">
              <CardContent className="pt-8 pb-6">
                <div className="text-xs font-semibold text-primary mb-2">EMPFOHLEN</div>
                <h3 className="text-xl font-bold text-foreground mb-4">Active Sourcing</h3>
                <p className="text-muted-foreground mb-6">
                  Aktive Kandidatensuche durch unser Recruiting-Team.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Alle Stellenanzeigen-Features
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Direktansprache passender Kandidaten
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Persönliche Beratung
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-8 pb-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Executive Search</h3>
                <p className="text-muted-foreground mb-6">
                  Diskrete Suche nach Führungskräften und Spezialisten.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Alle Active Sourcing-Features
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Exklusive Kandidatensuche
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Marktanalyse & Beratung
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to="/fuer-arbeitgeber">
                Unverbindlich anfragen
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Loesungen;
