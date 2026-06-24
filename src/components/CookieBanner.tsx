import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user already accepted
    const accepted = localStorage.getItem("cookies-accepted");
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookies-accepted", "true");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookies-accepted", "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-2xl z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Datenschutz & Cookies</h3>
            <p className="text-sm text-muted-foreground">
              Wir nutzen Cookies und andere Tracking-Technologien, um Ihre Erfahrung zu verbessern und unsere Website zu analysieren.{" "}
              <a href="/datenschutz" className="text-primary hover:underline">
                Mehr erfahren
              </a>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="whitespace-nowrap"
            >
              Ablehnen
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="whitespace-nowrap"
            >
              Akzeptieren
            </Button>
          </div>
          <button
            onClick={handleReject}
            className="absolute top-4 right-4 sm:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
