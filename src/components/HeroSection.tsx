import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Briefcase, Zap } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import genossenschaftLogo from "@/assets/steuerberatergenossenschaft-logo.webp";

interface HeroSectionProps {
  onSearch: (filters: { title: string; location: string; employmentType?: string }) => void;
}

const HeroSection = ({ onSearch }: HeroSectionProps) => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<string>("vollzeit");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ 
      title, 
      location, 
      employmentType: employmentType === "all" ? undefined : employmentType || undefined 
    });
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/80" />
      
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
              Dein Karrierestützpunkt{" "}
              <span className="text-primary">in der Steuerwelt</span>
            </h1>
          </div>
          <div className="flex justify-start pl-2 mb-6">
            <img
              src={genossenschaftLogo}
              alt="Deutsche Steuerberatergenossenschaft – Mitglied"
              className="h-20 md:h-24 w-auto object-contain mix-blend-multiply"
            />
          </div>
          <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 bg-featured/20 text-featured px-4 py-2 rounded-full text-sm font-semibold border border-featured/30">
              <Zap className="h-4 w-4" strokeWidth={1.5} />
              In nur 30 Sekunden bewerben – ohne Lebenslauf, ohne Anschreiben
            </div>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground mb-10">
            Finde exklusive Positionen in Top-Steuerkanzleien – diskret, schnell und ohne Anschreiben.
          </p>

          <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  type="text"
                  placeholder="Was suchst du? (z.B. Lohnbuchhalter)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  type="text"
                  placeholder="Wo?"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="relative flex-1">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" strokeWidth={1.5} />
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger className="pl-10 h-12 bg-background">
                    <SelectValue placeholder="Anstellungsart" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="vollzeit">Vollzeit</SelectItem>
                    <SelectItem value="teilzeit">Teilzeit</SelectItem>
                    <SelectItem value="minijob">Minijob</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                <Search className="h-5 w-5 mr-2" strokeWidth={1.5} />
                Suchen
              </Button>
            </div>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="text-sm text-muted-foreground">Beliebte Suchen:</span>
            <button 
              onClick={() => onSearch({ title: "Steuerfachangestellte", location: "" })}
              className="text-sm text-primary hover:underline"
            >
              Steuerfachangestellte
            </button>
            <span className="text-muted-foreground">•</span>
            <button 
              onClick={() => onSearch({ title: "Lohnbuchhalter", location: "" })}
              className="text-sm text-primary hover:underline"
            >
              Lohnbuchhalter
            </button>
            <span className="text-muted-foreground">•</span>
            <button 
              onClick={() => onSearch({ title: "Bilanzbuchhalter", location: "" })}
              className="text-sm text-primary hover:underline"
            >
              Bilanzbuchhalter
            </button>
            <span className="text-muted-foreground">•</span>
            <button 
              onClick={() => onSearch({ title: "DATEV", location: "" })}
              className="text-sm text-primary hover:underline"
            >
              DATEV
            </button>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
