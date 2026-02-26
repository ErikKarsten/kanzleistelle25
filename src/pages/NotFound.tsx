import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-muted/30 px-4">
        <div className="text-center max-w-md space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-primary">404</h1>
          <p className="text-lg text-muted-foreground">
            Die Seite <code className="text-sm bg-muted px-2 py-1 rounded">{location.pathname}</code> wurde nicht gefunden.
          </p>
          <p className="text-muted-foreground">
            Möglicherweise wurde die Seite verschoben oder existiert nicht mehr.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Zur Startseite
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
