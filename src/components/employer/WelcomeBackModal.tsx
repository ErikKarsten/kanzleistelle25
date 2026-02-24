import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, ArrowRight } from "lucide-react";

interface WelcomeBackModalProps {
  newApplications: any[];
  onViewAll: () => void;
}

const SESSION_KEY = "kanzlei_welcome_shown";

const WelcomeBackModal = ({ newApplications, onViewAll }: WelcomeBackModalProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (newApplications.length === 0) return;
    // Only show once per browser session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(true);

    // Confetti
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [newApplications]);

  if (!open) return null;

  const count = newApplications.length;
  const topThree = newApplications.slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Schön, dass Sie wieder da sind! ✨</DialogTitle>
          <DialogDescription>
            In Ihrer Abwesenheit {count === 1 ? "ist" : "sind"}{" "}
            <span className="font-semibold text-foreground">{count} neue Bewerbung{count !== 1 ? "en" : ""}</span>{" "}
            eingegangen.
          </DialogDescription>
        </DialogHeader>

        {topThree.length > 0 && (
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Neueste Bewerber</p>
            {topThree.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {(app.first_name?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {app.first_name} {app.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{app.jobs?.title || "Offene Stelle"}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  Neu
                </Badge>
              </div>
            ))}
            {count > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                … und {count - 3} weitere
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1"
            onClick={() => {
              setOpen(false);
              onViewAll();
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            Jetzt alle ansehen
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Später
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeBackModal;
