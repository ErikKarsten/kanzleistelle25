import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildWelcomeApplicantEmail } from "@/lib/emailTemplates";
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
  const queryClient = useQueryClient();
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

      // Invalidate dashboard queries so applications show immediately
      queryClient.invalidateQueries({ queryKey: ["applicant-applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });

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

  const hasPassword = password.length >= 6;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isReady = hasPassword && passwordsMatch;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h4 className="font-bold text-foreground">Dein Konto sichern</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-snug">
          Sichere dir jetzt deinen Zugang, um den Status deiner Bewerbung jederzeit zu verfolgen.
        </p>

        <form onSubmit={handleCreateAccount} className="space-y-2.5">
          <div>
            <Label className="text-xs text-muted-foreground">E-Mail</Label>
            <Input value={email} disabled className="bg-muted/50 h-9 mt-0.5" />
          </div>

          <div>
            <Label htmlFor="acc-password" className="text-sm">Passwort vergeben *</Label>
            <div className="relative mt-0.5">
              <Input
                id="acc-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mind. 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-9"
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

          <div>
            <Label htmlFor="acc-confirm" className="text-sm">Passwort bestätigen *</Label>
            <Input
              id="acc-confirm"
              type="password"
              placeholder="Passwort wiederholen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-9 mt-0.5"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive mt-0.5">Passwörter stimmen nicht überein.</p>
            )}
          </div>

          <Button
            type="submit"
            className={`w-full font-bold text-base tracking-wide transition-all ${
              isReady
                ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 scale-[1.02]"
                : ""
            }`}
            size="lg"
            disabled={isCreating || !isReady}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Konto wird aktiviert...
              </>
            ) : (
              <>
                KONTO AKTIVIEREN & ZUM DASHBOARD
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Kostenloser Zugang zu deinem persönlichen Bewerber-Portal.
          </p>
        </form>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
          <span>Deine Daten sind sicher. Du kannst dein Konto jederzeit löschen.</span>
        </div>

        <div className="flex justify-center pt-1">
          <img
            src={genossenschaftLogo}
            alt="Deutsche Steuerberatergenossenschaft – Mitglied"
            className="h-8 opacity-50 object-contain"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-sm text-muted-foreground/70 hover:text-muted-foreground py-1.5 transition-colors"
      >
        Später erledigen
      </button>
    </div>
  );
};

export default ApplyAccountCreation;
