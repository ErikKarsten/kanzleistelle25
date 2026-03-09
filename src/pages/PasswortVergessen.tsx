import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

const PasswortVergessen = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/passwort-zuruecksetzen`,
      });

      if (error) throw error;
      setIsSent(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      // Always show success to prevent email enumeration
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 bg-secondary/20">
        <div className="container">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Passwort vergessen?</CardTitle>
              <CardDescription>
                Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSent ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Falls ein Konto mit <strong>{email}</strong> existiert, haben wir Ihnen eine E-Mail mit einem Link zum Zurücksetzen gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/login">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Zurück zum Login
                    </Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ihre@email.de"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      "Link senden"
                    )}
                  </Button>
                  <div className="text-center pt-2">
                    <Link to="/login" className="text-sm text-primary hover:underline">
                      <ArrowLeft className="h-3 w-3 inline mr-1" />
                      Zurück zum Login
                    </Link>
                  </div>
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

export default PasswortVergessen;
