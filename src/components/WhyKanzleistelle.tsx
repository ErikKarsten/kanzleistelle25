import { CheckCircle2, Zap, FileX, Clock, Shield, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  { text: "Express-Bewerbung in 30 Sekunden", highlight: true },
  { text: "Spezialisiert auf Steuerberatung", highlight: false },
  { text: "Über 500 aktive Stellenangebote", highlight: false },
  { text: "Direkte Kontakte zu Top-Steuerkanzleien", highlight: false },
  { text: "Kostenlose Nutzung für Bewerber", highlight: false },
  { text: "Persönliche Karriereberatung", highlight: false },
  { text: "DATEV-kompatible Kanzleien", highlight: false },
];

const uspFeatures = [
  {
    icon: FileX,
    title: "Kein Lebenslauf nötig",
    description: "Für den ersten Kontakt brauchen Sie keinen ausformulierten Lebenslauf.",
  },
  {
    icon: Clock,
    title: "30 Sekunden Bewerbung",
    description: "Bewerben Sie sich schneller als je zuvor – in nur wenigen Klicks.",
  },
  {
    icon: Smartphone,
    title: "Mobil optimiert",
    description: "Bewerben Sie sich bequem vom Smartphone – jederzeit und überall.",
  },
  {
    icon: Shield,
    title: "100% Diskret",
    description: "Ihre Daten sind sicher. Kanzleien sehen nur, was Sie freigeben.",
  },
];

const WhyKanzleistelle = () => {
  return (
    <section className="py-16">
      <div className="container">
        {/* USP Section - Why Kanzleistelle24? */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Zap className="h-4 w-4" />
              Das unterscheidet uns
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Warum Kanzleistelle24?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wir machen Bewerbungen so einfach wie nie zuvor. Kein Anschreiben, kein Lebenslauf – 
              nur Sie und Ihr Traumjob.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {uspFeatures.map((feature, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Original Benefits Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Die Jobbörse für Ihre Karriere in der Steuerbranche
            </h2>
            <p className="text-muted-foreground mb-8">
              Kanzleistelle24 ist die führende Plattform für Steuerfachkräfte. 
              Wir verbinden qualifizierte Bewerber mit renommierten Steuerkanzleien und 
              Wirtschaftsprüfungsgesellschaften in ganz Deutschland.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className={`flex items-center gap-3 ${benefit.highlight ? 'font-semibold' : ''}`}>
                  {benefit.highlight ? (
                    <Zap className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  )}
                  <span className={benefit.highlight ? 'text-primary' : 'text-foreground'}>{benefit.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-secondary/30 rounded-2xl p-8 md:p-12">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground mb-6">Aktive Stellenangebote</p>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div>
                  <div className="text-3xl font-bold text-foreground">200+</div>
                  <p className="text-sm text-muted-foreground">Partner-Kanzleien</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">50k+</div>
                  <p className="text-sm text-muted-foreground">Erfolgreiche Vermittlungen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyKanzleistelle;
