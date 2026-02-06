import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Briefcase, User, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, role, isLoading, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "employer") return "/dashboard";
    return "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">Kanzleistelle24</span>
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
          {isLoading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  {user?.email?.split("@")[0] || "Konto"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to={getDashboardLink()} className="flex items-center cursor-pointer">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {role === "admin" ? "Admin-Dashboard" : "Zum Dashboard"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">
                  <User className="h-4 w-4 mr-2" />
                  Anmelden
                </Link>
              </Button>
              <Button size="sm" className="bg-background text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <Link to="/register-employer">Kanzlei registrieren</Link>
              </Button>
            </>
          )}
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
              {isAuthenticated ? (
                <>
                  <Button variant="default" size="sm" className="w-full" asChild>
                    <Link to={getDashboardLink()} onClick={() => setIsMenuOpen(false)}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Zum Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Abmelden
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
