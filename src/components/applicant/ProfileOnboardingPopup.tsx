import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Rocket } from "lucide-react";

interface ProfileOnboardingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  firstName: string;
  onComplete: () => void;
}

const CHECKLIST = [
  { key: "first_name", label: "Vorname angegeben" },
  { key: "last_name", label: "Nachname angegeben" },
  { key: "email", label: "E-Mail hinterlegt" },
  { key: "phone", label: "Telefonnummer" },
  { key: "resume_url", label: "Lebenslauf hochgeladen" },
  { key: "earliest_start_date", label: "Eintrittsdatum" },
  { key: "salary_expectation", label: "Gehaltsvorstellung" },
  { key: "notice_period", label: "Kündigungsfrist" },
  { key: "special_skills", label: "Fachkenntnisse" },
] as const;

const ProfileOnboardingPopup = ({
  open,
  onOpenChange,
  application,
  firstName,
  onComplete,
}: ProfileOnboardingPopupProps) => {
  const { percentage, items } = useMemo(() => {
    if (!application) return { percentage: 0, items: CHECKLIST.map((c) => ({ ...c, done: false })) };
    const mapped = CHECKLIST.map((c) => ({
      ...c,
      done: !!application[c.key] && String(application[c.key]).trim() !== "",
    }));
    const done = mapped.filter((i) => i.done).length;
    return { percentage: Math.round((done / mapped.length) * 100), items: mapped };
  }, [application]);

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
            <Progress value={percentage} className="h-2.5" />
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
