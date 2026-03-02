import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Search, Building, Calculator } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Express-Bewerbung",
    description: "Bewerben Sie sich in nur 30 Sekunden – ohne Lebenslauf, ohne Anschreiben.",
    highlight: true,
  },
  {
    icon: Calculator,
    title: "DATEV-Expertise",
    description: "Finden Sie Positionen, die Ihre DATEV-Kenntnisse wertschätzen und fördern.",
  },
  {
    icon: Building,
    title: "Top Steuerkanzleien",
    description: "Zugang zu exklusiven Stellenangeboten führender Kanzleien mit moderner Kanzleikultur.",
  },
  {
    icon: Search,
    title: "Mandantenbetreuung",
    description: "Entdecken Sie Positionen mit direktem Mandantenkontakt und Entwicklungsperspektiven.",
  },
];

const FeatureCards = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Warum Kanzleistelle24?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Wir verbinden qualifizierte Steuerfachkräfte mit den besten Kanzleien Deutschlands.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`text-center hover:shadow-md transition-shadow ${
                feature.highlight ? 'border-primary border-2 bg-primary/5' : ''
              }`}
            >
              <CardHeader>
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  feature.highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                }`}>
                  <feature.icon className={`h-6 w-6 ${feature.highlight ? '' : 'text-primary'}`} strokeWidth={1.5} />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
