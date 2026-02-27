import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Mail, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import NeeleContactDrawer from "./NeeleContactDrawer";
import neeleImage from "@/assets/neele-ehlers.jpg";

const Footer = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Persönliche Note Section */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/30 to-primary/5 py-16 border-t">
        <div className="container">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <img
              src={neeleImage}
              alt="Neele Ehlers – Recruiting Managerin"
              className="w-32 h-32 rounded-full object-cover shadow-xl ring-4 ring-background shrink-0"
            />
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Ihre Karriere in guten Händen
              </h3>
              <p className="text-muted-foreground mb-4">
                Neele Ehlers begleitet Sie persönlich durch den Bewerbungsprozess – 
                ob Sie den Traumjob suchen oder die besten Talente für Ihre Kanzlei.
              </p>
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <a
                  href="mailto:neele@kanzleistelle24.de"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  neele@kanzleistelle24.de
                </a>
                <a
                  href="tel:+4940123456789"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  +49 40 123 456 789
                </a>
              </div>
              <Button
                className="mt-4"
                onClick={() => setDrawerOpen(true)}
              >
                Kontakt aufnehmen
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <NeeleContactDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

    <footer className="bg-secondary/50 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-primary">Kanzleistelle24</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Die führende Jobbörse für die Rechtsbranche in Deutschland.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Für Bewerber</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Stellenangebote
                </Link>
              </li>
              <li>
                <Link to="/karrieretipps" className="text-muted-foreground hover:text-primary">
                  Karrieretipps
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Für Arbeitgeber</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/fuer-arbeitgeber" className="text-muted-foreground hover:text-primary">
                  Talente finden
                </Link>
              </li>
              <li>
                <Link to="/loesungen" className="text-muted-foreground hover:text-primary">
                  Lösungen
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/impressum" className="text-muted-foreground hover:text-primary">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-muted-foreground hover:text-primary">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link to="/agb" className="text-muted-foreground hover:text-primary">
                  AGB
                </Link>
              </li>
               <li>
                 <Link to="/admin/login" className="text-muted-foreground/50 hover:text-muted-foreground text-xs">
                   Admin
                 </Link>
               </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Kanzleistelle24. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;
