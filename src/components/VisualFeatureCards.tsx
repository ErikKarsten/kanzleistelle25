import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import candidateLaptopImage from "@/assets/candidate-laptop.jpg";
import teamMeetingImage from "@/assets/team-meeting.jpg";
import quickApplyImage from "@/assets/quick-apply.jpg";

const features = [
  {
    image: candidateLaptopImage,
    title: "Für Kandidaten",
    subtitle: "Dein Traumjob in der Steuerwelt",
    description: "Entdecke spannende Karrieremöglichkeiten mit DATEV-Expertise und echter Kanzleikultur.",
    buttonText: "Jobs entdecken",
    buttonAction: "jobs",
    highlight: false,
  },
  {
    image: teamMeetingImage,
    title: "Für Steuerkanzleien",
    subtitle: "Finden Sie Ihre Experten",
    description: "Erreichen Sie qualifizierte Fachkräfte für Mandantenbetreuung und Buchhaltung.",
    buttonText: "Talente finden",
    buttonAction: "employer",
    highlight: false,
  },
  {
    image: quickApplyImage,
    title: "So einfach geht's",
    subtitle: "Schnell. Diskret. Erfolgreich.",
    description: "In nur 30 Sekunden bewerben – ganz ohne Lebenslauf oder Anschreiben.",
    buttonText: "Jetzt starten",
    buttonAction: "apply",
    highlight: true,
  },
];

interface VisualFeatureCardsProps {
  onScrollToJobs?: () => void;
}

const VisualFeatureCards = ({ onScrollToJobs }: VisualFeatureCardsProps) => {
  const handleButtonClick = (action: string) => {
    if ((action === "jobs" || action === "apply") && onScrollToJobs) {
      onScrollToJobs();
    }
  };

  return (
    <section className="py-16 bg-secondary/20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Deine Karriere in der Steuerwelt startet hier
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ob du deinen Traumjob suchst oder Top-Talente für deine Steuerkanzlei finden möchtest – 
            wir verbinden die besten Köpfe der Branche.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`overflow-hidden group hover:shadow-xl transition-all duration-300 ${
                feature.highlight ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="relative overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {feature.highlight && (
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    30 Sek.
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-primary font-medium mb-1">{feature.title}</p>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.subtitle}</h3>
                <p className="text-muted-foreground text-sm mb-4">{feature.description}</p>
                {feature.buttonAction === "employer" ? (
                  <Button className="w-full" variant="outline" asChild>
                    <Link to="/fuer-arbeitgeber">
                      {feature.buttonText}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={feature.highlight ? "default" : "outline"}
                    onClick={() => handleButtonClick(feature.buttonAction)}
                  >
                    {feature.buttonText}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisualFeatureCards;
