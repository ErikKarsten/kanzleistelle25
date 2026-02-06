import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Heart,
  Target,
  Users,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Building2,
  Briefcase,
} from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Spezialisierung",
    description:
      "Wir fokussieren uns ausschließlich auf die Steuerbranche. Das macht uns zu Experten für Ihre Karriere.",
  },
  {
    icon: Heart,
    title: "Persönlichkeit",
    description:
      "Hinter jeder Bewerbung steht ein Mensch. Wir behandeln jeden Kandidaten und jede Kanzlei individuell.",
  },
  {
    icon: Users,
    title: "Netzwerk",
    description:
      "Jahrelange Erfahrung in der Branche hat uns ein starkes Netzwerk aus Kanzleien und Fachkräften aufgebaut.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "Mit unserer Express-Bewerbung in 30 Sekunden machen wir Recruiting so einfach wie nie zuvor.",
  },
];

const milestones = [
  {
    year: "Die Idee",
    title: "Frustration wird zur Vision",
    description:
      "Aus eigener Erfahrung im Steuerbereich wissen wir: Gute Fachkräfte und passende Kanzleien finden schwer zusammen. Das wollten wir ändern.",
  },
  {
    year: "Der Fokus",
    title: "Nische statt Masse",
    description:
      "Statt ein weiteres generisches Jobportal zu bauen, haben wir uns bewusst auf die Steuerbranche spezialisiert.",
  },
  {
    year: "Die Innovation",
    title: "30-Sekunden-Bewerbung",
    description:
      "Wir haben den Bewerbungsprozess revolutioniert: Kein Anschreiben, kein Lebenslauf für den ersten Kontakt.",
  },
  {
    year: "Die Mission",
    title: "Jeden Tag besser",
    description:
      "Wir arbeiten kontinuierlich daran, die beste Plattform für Steuerfachkräfte und Kanzleien zu sein.",
  },
];

const UeberUns = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-secondary/30 py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Über Kanzleistelle24
              </h1>
              <p className="text-lg text-muted-foreground">
                Wir glauben, dass großartige Karrieren in der Steuerbranche nicht dem Zufall 
                überlassen werden sollten. Deshalb haben wir eine Plattform geschaffen, die 
                Fachkräfte und Kanzleien zusammenbringt – einfach, schnell und persönlich.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16 container">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Unsere Mission
              </h2>
              <p className="text-muted-foreground mb-6">
                Die Steuerbranche steht vor großen Herausforderungen: Fachkräftemangel, 
                hohe Fluktuation und veraltete Recruiting-Methoden. Wir sind angetreten, 
                das zu ändern.
              </p>
              <p className="text-muted-foreground mb-6">
                Mit Kanzleistelle24 haben wir eine Plattform geschaffen, die den 
                Bewerbungsprozess revolutioniert. Unsere Express-Bewerbung ermöglicht 
                es Kandidaten, sich in nur 30 Sekunden zu bewerben – ohne aufwändiges 
                Anschreiben oder perfekten Lebenslauf.
              </p>
              <p className="text-muted-foreground">
                Für Kanzleien bedeutet das: Zugang zu motivierten Kandidaten, die wirklich 
                interessiert sind – nicht nur an irgendeinem Job, sondern an einer Karriere 
                in der Steuerberatung.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/30 rounded-2xl p-8 md:p-12">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Für Kanzleien</h3>
                    <p className="text-sm text-muted-foreground">
                      Qualifizierte Kandidaten ohne großen Aufwand finden
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Für Kandidaten</h3>
                    <p className="text-sm text-muted-foreground">
                      Traumjob finden ohne Bewerbungsstress
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-secondary/20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Unsere Werte
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Was uns antreibt und unterscheidet.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <Card key={index} className="text-center border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-8 pb-6">
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <value.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story / Timeline */}
        <section className="py-16 container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Unsere Geschichte
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-6">
                <div className="w-24 shrink-0">
                  <span className="text-sm font-semibold text-primary">{milestone.year}</span>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-primary/20 pl-6 relative">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary" />
                  <h3 className="font-semibold text-foreground mb-2">{milestone.title}</h3>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Trust Us */}
        <section className="py-16 bg-secondary/20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                Warum Kanzleistelle24?
              </h2>
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>Spezialisiert auf Steuer</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>Persönlich geprüfte Kanzleien</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>Diskrete Vermittlung</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Starten Sie jetzt
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Ob Sie Ihren Traumjob suchen oder die besten Talente für Ihre Kanzlei – 
              wir sind für Sie da.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/">
                  Jobs entdecken
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="bg-background text-primary hover:bg-background/90"
                asChild
              >
                <Link to="/fuer-arbeitgeber">Für Arbeitgeber</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UeberUns;
