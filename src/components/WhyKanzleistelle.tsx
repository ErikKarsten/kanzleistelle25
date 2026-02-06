import { CheckCircle2, Zap } from "lucide-react";

const benefits = [
  { text: "Express-Bewerbung in 30 Sekunden", highlight: true },
  { text: "Spezialisiert auf die Rechtsbranche", highlight: false },
  { text: "Über 500 aktive Stellenangebote", highlight: false },
  { text: "Direkte Kontakte zu Top-Kanzleien", highlight: false },
  { text: "Kostenlose Nutzung für Bewerber", highlight: false },
  { text: "Persönliche Karriereberatung", highlight: false },
  { text: "Datenschutzkonforme Bewerbungen", highlight: false },
];

const WhyKanzleistelle = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Die Jobbörse für Ihre Karriere im Rechtswesen
            </h2>
            <p className="text-muted-foreground mb-8">
              Kanzleistelle ist die führende Plattform für Fachkräfte in der Rechtsbranche. 
              Wir verbinden qualifizierte Bewerber mit renommierten Kanzleien und 
              Rechtsabteilungen in ganz Deutschland.
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
