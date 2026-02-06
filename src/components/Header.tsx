import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Briefcase, User } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">Kanzleistelle</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Stellenangebote
          </Link>
          <Link to="/loesungen" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Lösungen
          </Link>
          <Link to="/fuer-arbeitgeber" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Für Arbeitgeber
          </Link>
          <Link to="/karrieretipps" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Karrieretipps
          </Link>
          <Link to="/ueber-uns" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Über uns
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">
              <User className="h-4 w-4 mr-2" />
              Anmelden
            </Link>
          </Button>
          <Button size="sm" className="bg-background text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground" asChild>
            <Link to="/register-employer">Kanzlei registrieren</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-4">
            <Link 
              to="/" 
              className="text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Stellenangebote
            </Link>
            <Link 
              to="/loesungen" 
              className="text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Lösungen
            </Link>
            <Link 
              to="/fuer-arbeitgeber" 
              className="text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Für Arbeitgeber
            </Link>
            <Link 
              to="/karrieretipps" 
              className="text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Karrieretipps
            </Link>
            <Link 
              to="/ueber-uns" 
              className="text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Über uns
            </Link>
            <div className="flex flex-col gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <User className="h-4 w-4 mr-2" />
                  Anmelden
                </Link>
              </Button>
              <Button size="sm" className="w-full" asChild>
                <Link to="/register-employer" onClick={() => setIsMenuOpen(false)}>
                  Kanzlei registrieren
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
