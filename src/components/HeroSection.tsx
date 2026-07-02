import { Button } from "@/components/ui/button";
import { Briefcase, Building2, UserPlus } from "lucide-react";
import officeModernImage from "@/assets/office-modern.webp";

interface HeroSectionProps {
  onContactClick: () => void;
  onApplyClick: () => void;
}

const HeroSection = ({ onContactClick, onApplyClick }: HeroSectionProps) => {

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${officeModernImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground mb-6">
            <Briefcase className="h-4 w-4" />
            Die Plattform für die Steuerbranche
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">
            Der Treffpunkt für<br />
            Steuerexperten &amp; Kanzleien
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Ob Sie qualifizierte Fachkräfte suchen oder Ihre nächste
            Karrierechance — bei Kanzleistelle24 finden Sie zusammen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button
              size="lg"
              className="bg-background text-primary font-bold rounded-md shadow-sm hover:bg-background/90 h-12 px-8"
              onClick={onContactClick}
            >
              <Building2 className="h-5 w-5 mr-2" />
              Als Kanzlei Talente finden
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white bg-white/10 hover:bg-white hover:text-primary font-bold h-12 px-8"
              onClick={onApplyClick}
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Jetzt initiativ bewerben
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-10">
            <div className="bg-background/20 backdrop-blur-sm p-4 rounded-lg border border-background/30">
              <div className="text-2xl font-bold text-primary-foreground">30 Sek.</div>
              <div className="text-xs text-primary-foreground/80">Express-Bewerbung</div>
            </div>
            <div className="bg-background/20 backdrop-blur-sm p-4 rounded-lg border border-background/30">
              <div className="text-2xl font-bold text-primary-foreground">24h</div>
              <div className="text-xs text-primary-foreground/80">Erste Rückmeldung</div>
            </div>
            <div className="bg-background/20 backdrop-blur-sm p-4 rounded-lg border border-background/30">
              <div className="text-2xl font-bold text-primary-foreground">100%</div>
              <div className="text-xs text-primary-foreground/80">Branchenfokus</div>
            </div>
            <div className="bg-background/20 backdrop-blur-sm p-4 rounded-lg border border-background/30">
              <div className="text-2xl font-bold text-primary-foreground">✓</div>
              <div className="text-xs text-primary-foreground/80">Geprüft</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
