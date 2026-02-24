import { useState } from "react";
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
import { PartyPopper, Eye, Sparkles } from "lucide-react";

interface NewApplicantData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  jobTitle: string | null;
  created_at: string | null;
}

export const useNewApplicantNotification = () => {
  const [applicant, setApplicant] = useState<NewApplicantData | null>(null);

  const notify = (data: NewApplicantData) => {
    setApplicant(data);
    // 🎉 Confetti burst
    const end = Date.now() + 1200;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const dismiss = () => setApplicant(null);

  return { applicant, notify, dismiss };
};

interface NewApplicantModalProps {
  applicant: NewApplicantData | null;
  onDismiss: () => void;
  onViewDetails: (appId: string) => void;
}

const NewApplicantModal = ({ applicant, onDismiss, onViewDetails }: NewApplicantModalProps) => {
  if (!applicant) return null;

  const name = [applicant.first_name, applicant.last_name].filter(Boolean).join(" ") || "Unbekannt";
  const date = applicant.created_at
    ? new Date(applicant.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Dialog open={!!applicant} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 animate-bounce">
            <PartyPopper className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Neue Bewerbung! 🎉</DialogTitle>
          <DialogDescription>
            Soeben ist eine neue Bewerbung eingegangen.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground text-lg">{name}</span>
          </div>
          {applicant.jobTitle && (
            <Badge variant="secondary" className="text-sm">
              {applicant.jobTitle}
            </Badge>
          )}
          {date && (
            <p className="text-xs text-muted-foreground">{date}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1"
            onClick={() => {
              onViewDetails(applicant.id);
              onDismiss();
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Details ansehen
          </Button>
          <Button variant="outline" className="flex-1" onClick={onDismiss}>
            Super! 👍
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewApplicantModal;
