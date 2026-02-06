import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ValueProposition = () => {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Bereit für den nächsten Karriereschritt?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Registrieren Sie sich kostenlos und erhalten Sie personalisierte Jobempfehlungen, 
            Karriere-Tipps und exklusive Stellenangebote direkt in Ihr Postfach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Kostenlos registrieren
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="secondary" className="bg-background text-primary hover:bg-background/90 font-semibold">
              Für Arbeitgeber
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
