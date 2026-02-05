import { Link } from "react-router-dom";
import { Briefcase } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-primary">Kanzleistelle</span>
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
                <Link to="/karriere-tipps" className="text-muted-foreground hover:text-primary">
                  Karriere-Tipps
                </Link>
              </li>
              <li>
                <Link to="/gehaltsrechner" className="text-muted-foreground hover:text-primary">
                  Gehaltsrechner
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Für Arbeitgeber</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/job-inserieren" className="text-muted-foreground hover:text-primary">
                  Job inserieren
                </Link>
              </li>
              <li>
                <Link to="/preise" className="text-muted-foreground hover:text-primary">
                  Preise
                </Link>
              </li>
              <li>
                <Link to="/arbeitgeber" className="text-muted-foreground hover:text-primary">
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
                 <Link to="/admin-dashboard" className="text-muted-foreground/50 hover:text-muted-foreground text-xs">
                   Admin
                 </Link>
               </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Kanzleistelle. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
