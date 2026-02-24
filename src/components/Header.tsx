import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Briefcase, User, LayoutDashboard, LogOut, Building2, Settings } from "lucide-react";
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
  const queryClient = useQueryClient();
  const { user, role, companyName, companyLogoUrl, isLoading, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
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
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    {companyLogoUrl ? (
                      <AvatarImage src={companyLogoUrl} alt={companyName || "Logo"} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {companyName ? companyName.substring(0, 2).toUpperCase() : <Building2 className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium max-w-[150px] truncate">
                    {companyName || user?.email?.split("@")[0] || "Konto"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover border border-border shadow-lg z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium truncate">{companyName || "Mein Konto"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to={getDashboardLink()} className="flex items-center cursor-pointer">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {role === "admin" ? "Admin-Dashboard" : "Dashboard"}
                  </Link>
                </DropdownMenuItem>
                {role === "employer" && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard?tab=profile" className="flex items-center cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Kanzlei-Einstellungen
                    </Link>
                  </DropdownMenuItem>
                )}
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
