import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const PasswortZuruecksetzen = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryState, setRecoveryState] = useState<"idle" | "valid" | "expired" | "invalid">("idle");

  useEffect(() => {
    const rawHash = window.location.hash;
    const hashParams = new URLSearchParams(rawHash.startsWith("#") ? rawHash.slice(1) : rawHash);
    const hasRecoveryToken = hashParams.has("access_token") && hashParams.get("type") === "recovery";
    const hasExpiredRecoveryError =
      hashParams.get("error") === "access_denied" && hashParams.get("error_code") === "otp_expired";

    if (hasRecoveryToken) {
      setRecoveryState("valid");
    } else if (hasExpiredRecoveryError) {
      setRecoveryState("expired");
    } else {
      setRecoveryState("invalid");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryState("valid");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setIsSuccess(true);
      window.history.replaceState(null, "", window.location.pathname);
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const showRecoveryForm = recoveryState === "valid";
  const showExpiredMessage = recoveryState === "expired";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 bg-secondary/20">
        <div className="container">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Neues Passwort setzen</CardTitle>
              <CardDescription>
                Wählen Sie ein neues, sicheres Passwort für Ihr Konto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ihr Passwort wurde erfolgreich geändert. Sie werden zum Login weitergeleitet…
                  </p>
                </div>
              ) : showExpiredMessage ? (
                <div className="text-center space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Dieser Passwort-Reset-Link ist abgelaufen. Bitte fordern Sie eine neue Reset-Mail an.
                    </AlertDescription>
                  </Alert>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/passwort-vergessen">Neue Reset-Mail anfordern</Link>
                  </Button>
                </div>
              ) : !showRecoveryForm ? (
                <div className="text-center space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ungültiger Link. Bitte fordern Sie einen neuen Link an.
                    </AlertDescription>
                  </Alert>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/passwort-vergessen">Neuen Link anfordern</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="password">Neues Passwort</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Mindestens 6 Zeichen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Passwort wiederholen"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Wird gespeichert...
                      </>
                    ) : (
                      "Passwort ändern"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PasswortZuruecksetzen;
