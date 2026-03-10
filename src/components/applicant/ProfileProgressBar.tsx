import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileCompletionResult } from "@/lib/profileCompletion";

interface ProfileProgressBarProps {
  completion: ProfileCompletionResult;
  onNavigateToField?: (fieldKey: string) => void;
}

const ProfileProgressBar = ({ completion, onNavigateToField }: ProfileProgressBarProps) => {
  const [expanded, setExpanded] = useState(false);
  const { percentage, missing, items } = completion;

  if (percentage === 100) return null;

  // Gradient color: orange at low %, green at 100%
  const progressColor =
    percentage < 40
      ? "bg-orange-500"
      : percentage < 70
      ? "bg-amber-500"
      : percentage < 100
      ? "bg-emerald-500"
      : "bg-green-500";

  return (
    <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Dein Profil ist zu {percentage}% vollständig
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                percentage < 50
                  ? "border-orange-300 text-orange-600"
                  : "border-emerald-300 text-emerald-600"
              )}
            >
              {missing.length} {missing.length === 1 ? "Schritt" : "Schritte"} offen
            </Badge>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", progressColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-1.5">
          Ein vollständiges Profil erhöht deine Chancen auf eine Antwort um 80%!
        </p>
      </button>

      {expanded && (
        <div className="mt-4 space-y-1.5 animate-fade-in">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={(e) => {
                e.stopPropagation();
                if (!item.done && onNavigateToField) {
                  onNavigateToField(item.key);
                }
              }}
              className={cn(
                "flex items-center gap-2 text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors",
                !item.done && onNavigateToField
                  ? "hover:bg-primary/5 cursor-pointer"
                  : "cursor-default"
              )}
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>
                {item.label}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">+{item.weight}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileProgressBar;
