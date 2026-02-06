import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ArrowRight, CheckCircle2 } from "lucide-react";

const RegisterEmployer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    location: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Fehler",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Benutzer konnte nicht erstellt werden");
      }

      // 2. Create company entry (triggers auto-assignment of employer role)
      const { error: companyError } = await supabase
        .from("companies")
        .insert({
          name: formData.companyName,
          location: formData.location || null,
          description: formData.description || null,
          user_id: authData.user.id,
        });

      if (companyError) throw companyError;

      // Show verification step
      setStep("verify");
      
      toast({
        title: "Registrierung erfolgreich!",
        description: "Bitte überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Fehler bei der Registrierung",
        description: error.message || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Fast geschafft!</CardTitle>
              <CardDescription>
                Wir haben Ihnen eine Bestätigungs-E-Mail an{" "}
                <strong>{formData.email}</strong> gesendet.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
                Danach können Sie sich in Ihrem Dashboard anmelden.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">Zur Anmeldeseite</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 bg-secondary/20">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Kanzlei registrieren</CardTitle>
                <CardDescription>
                  Erstellen Sie Ihr Arbeitgeber-Konto und finden Sie qualifizierte Fachkräfte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Account Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Zugangsdaten</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail-Adresse *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        placeholder="info@kanzlei.de"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="password">Passwort *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          required
                          placeholder="Mindestens 6 Zeichen"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, confirmPassword: e.target.value })
                          }
                          required
                          placeholder="Passwort wiederholen"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Details */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-foreground">Kanzlei-Informationen</h3>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">Kanzleiname *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({ ...formData, companyName: e.target.value })
                        }
                        required
                        placeholder="Muster Steuerberatung GmbH"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Standort</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="z.B. München, Berlin, Hamburg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Kurzbeschreibung</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Erzählen Sie potenziellen Bewerbern etwas über Ihre Kanzlei..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Wird registriert..." : "Kanzlei registrieren"}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Mit der Registrierung akzeptieren Sie unsere{" "}
                    <Link to="/agb" className="text-primary hover:underline">AGB</Link> und{" "}
                    <Link to="/datenschutz" className="text-primary hover:underline">Datenschutzrichtlinie</Link>.
                  </p>

                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Bereits registriert?{" "}
                      <Link to="/login" className="text-primary font-medium hover:underline">
                        Jetzt anmelden
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterEmployer;
