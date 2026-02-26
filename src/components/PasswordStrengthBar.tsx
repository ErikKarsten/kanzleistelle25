import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthBarProps {
  password: string;
}

const getStrength = (pw: string): { score: number; label: string } => {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 10) score += 25;
  else if (pw.length >= 6) score += 10;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 25;
  if (/\d/.test(pw)) score += 25;
  if (/[^A-Za-z0-9]/.test(pw)) score += 25;

  if (score <= 10) return { score, label: "Sehr schwach" };
  if (score <= 35) return { score, label: "Schwach" };
  if (score <= 60) return { score, label: "Mittel" };
  if (score <= 85) return { score, label: "Stark" };
  return { score, label: "Sehr stark" };
};

const PasswordStrengthBar = ({ password }: PasswordStrengthBarProps) => {
  const { score, label } = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  const color =
    score <= 10
      ? "bg-destructive"
      : score <= 35
      ? "bg-orange-500"
      : score <= 60
      ? "bg-yellow-500"
      : score <= 85
      ? "bg-emerald-400"
      : "bg-emerald-600";

  return (
    <div className="space-y-1">
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

export default PasswordStrengthBar;
