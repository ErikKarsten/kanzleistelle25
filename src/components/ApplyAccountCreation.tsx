import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import PasswordStrengthBar from "@/components/PasswordStrengthBar";
import genossenschaftLogo from "@/assets/steuerberatergenossenschaft-logo.webp";

interface ApplyAccountCreationProps {
  email: string;
  firstName: string;
  applicationId: string;
  onAccountCreated: () => void;
  onSkip: () => void;
}

const ApplyAccountCreation = ({
  email,
  firstName,
  applicationId,
  onAccountCreated,
  onSkip,
}: ApplyAccountCreationProps) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Passwort zu kurz", description: "Mindestens 6 Zeichen erforderlich.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwörter stimmen nicht überein", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { first_name: firstName },
        },
      });

      if (error) throw error;

      // Link application and create candidate role via secure function
      if (data.user) {
        const { error: linkError } = await supabase.rpc("link_application_to_user", {
          _application_id: applicationId,
          _user_id: data.user.id,
          _email: email,
        });
        if (linkError) {
          console.error("Error linking application:", linkError);
        }
      }

      toast({
        title: "Konto gesichert! 🎉",
        description: "Willkommen im Bewerber-Portal. Du wirst weitergeleitet…",
      });

      onAccountCreated();

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate("/bewerber-dashboard", { replace: true });
      }, 1200);
    } catch (error: any) {
      const msg = error?.message || "Konto konnte nicht erstellt werden.";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h4 className="font-bold text-foreground">Dein Konto sichern</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          Sichere dir jetzt deinen Zugang zum Bewerber-Portal, um den Status deiner Bewerbung jederzeit zu verfolgen.
        </p>

        <form onSubmit={handleCreateAccount} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">E-Mail</Label>
            <Input value={email} disabled className="bg-muted/50" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="acc-password">Passwort vergeben *</Label>
            <div className="relative">
              <Input
                id="acc-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mind. 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="acc-confirm">Passwort bestätigen *</Label>
            <Input
              id="acc-confirm"
              type="password"
              placeholder="Passwort wiederholen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwörter stimmen nicht überein.</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Konto wird gesichert...
              </>
            ) : (
              "Konto jetzt sichern & zum Dashboard"
            )}
          </Button>
        </form>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
          <span>Deine Daten sind sicher. Du kannst dein Konto jederzeit löschen.</span>
        </div>

        {/* Trust anchor: Genossenschaft logo */}
        <div className="flex justify-center pt-2">
          <img
            src={genossenschaftLogo}
            alt="Deutsche Steuerberatergenossenschaft – Mitglied"
            className="h-8 opacity-50 object-contain"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onSkip}
        className="w-full text-muted-foreground"
        size="sm"
      >
        Später erledigen
      </Button>
    </div>
  );
};

export default ApplyAccountCreation;
