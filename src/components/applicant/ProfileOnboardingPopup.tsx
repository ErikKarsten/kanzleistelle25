import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateProfileCompletion } from "@/lib/profileCompletion";

interface ProfileOnboardingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  firstName: string;
  onComplete: () => void;
}

const ProfileOnboardingPopup = ({
  open,
  onOpenChange,
  application,
  firstName,
  onComplete,
}: ProfileOnboardingPopupProps) => {
  const completion = useMemo(() => calculateProfileCompletion(application), [application]);
  const { percentage, items } = completion;

  const progressColor =
    percentage < 40
      ? "bg-orange-500"
      : percentage < 70
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            Maximiere deine Chancen{firstName ? `, ${firstName}` : ""}! 🚀
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Kanzleien bevorzugen vollständige Profile. Ergänze jetzt deinen Lebenslauf und
            weitere Details, um schneller Rückmeldungen zu erhalten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Dein Profil</span>
              <Badge variant="secondary">{percentage}% fertig</Badge>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700 ease-out", progressColor)}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-1 gap-1.5">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>
                  {item.label}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">+{item.weight}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button size="lg" onClick={onComplete} className="w-full">
            Profil jetzt vervollständigen
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Vielleicht später
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileOnboardingPopup;
