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
  Quote,
} from "lucide-react";
import teamCollaborationImage from "@/assets/team-collaboration.webp";
import officeModernImage from "@/assets/office-modern.webp";

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
        {/* Hero Section with Image */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${officeModernImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
          <div className="container relative z-10">
            <div className="max-w-2xl text-primary-foreground">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Über Kanzleistelle24
              </h1>
              <p className="text-xl opacity-90">
                Wir glauben, dass großartige Karrieren in der Steuerbranche nicht dem Zufall 
                überlassen werden sollten.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Statement with Image */}
        <section className="py-20 container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Unsere Mission</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
                Die Steuerbranche verbinden
              </h2>
              <p className="text-muted-foreground mb-6 text-lg">
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
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Für Kanzleien</p>
                    <p className="text-sm text-muted-foreground">Top-Talente finden</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Für Kandidaten</p>
                    <p className="text-sm text-muted-foreground">Traumjob entdecken</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={teamCollaborationImage} 
                alt="Team bei der Arbeit" 
                className="rounded-2xl shadow-2xl"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg max-w-xs hidden md:block">
                <Quote className="h-8 w-8 mb-3 opacity-50" />
                <p className="text-sm italic">
                  "Wir bringen Menschen und Kanzleien zusammen, die wirklich zueinander passen."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-secondary/20">
          <div className="container">
            <div className="text-center mb-14">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Was uns antreibt</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
                Unsere Werte
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="pt-10 pb-8">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <value.icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-3">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story / Timeline */}
        <section className="py-20 container">
          <div className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Wie alles begann</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              Unsere Geschichte
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {milestones.map((milestone, index) => (
                <Card key={index} className="border-0 shadow-lg overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary to-primary/50" />
                  <CardContent className="pt-6 pb-6">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      {milestone.year}
                    </span>
                    <h3 className="font-bold text-xl text-foreground mt-2 mb-3">{milestone.title}</h3>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="grid gap-6 md:grid-cols-3 text-center">
                <div className="p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Spezialisiert auf Steuer</h3>
                  <p className="text-sm text-muted-foreground">100% Fokus auf die Steuerbranche</p>
                </div>
                <div className="p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Geprüfte Kanzleien</h3>
                  <p className="text-sm text-muted-foreground">Jede Kanzlei wird persönlich geprüft</p>
                </div>
                <div className="p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Diskrete Vermittlung</h3>
                  <p className="text-sm text-muted-foreground">Ihre Daten sind bei uns sicher</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Starten Sie jetzt
            </h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Ob Sie Ihren Traumjob suchen oder die besten Talente für Ihre Kanzlei – 
              wir sind für Sie da.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                <Link to="/">
                  Jobs entdecken
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="bg-background text-primary hover:bg-background/90 text-lg px-8"
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
