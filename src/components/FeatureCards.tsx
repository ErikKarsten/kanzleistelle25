import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Search, Building, Users } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Express-Bewerbung",
    description: "Bewerben Sie sich in nur 30 Sekunden – ohne Lebenslauf, ohne Anschreiben.",
    highlight: true,
  },
  {
    icon: Search,
    title: "Einfache Suche",
    description: "Finden Sie schnell passende Stellen mit unserer intelligenten Suchfunktion.",
  },
  {
    icon: Building,
    title: "Top Kanzleien",
    description: "Zugang zu exklusiven Stellenangeboten führender Kanzleien in ganz Deutschland.",
  },
  {
    icon: Users,
    title: "Persönliche Betreuung",
    description: "Unser Team unterstützt Sie bei Ihrer Karriereplanung in der Rechtsbranche.",
  },
];

const FeatureCards = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Warum Kanzleistelle?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Wir verbinden qualifizierte Fachkräfte mit den besten Arbeitgebern der Rechtsbranche.
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
                  <feature.icon className={`h-6 w-6 ${feature.highlight ? '' : 'text-primary'}`} />
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
