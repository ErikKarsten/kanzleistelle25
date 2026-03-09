import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, role, isLoading: authLoading, refreshAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const getRedirectPath = (userRole: string | null) => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "employer") return "/dashboard";
    return "/bewerber-dashboard";
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(getRedirectPath(role), { replace: true });
    }
  }, [isAuthenticated, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDebugInfo(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      console.log("Login successful for:", data.user.email);

      // Check user roles to determine redirect
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      }

      // Check for company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (companyError) {
        console.error("Error fetching company:", companyError);
      }

      const isAdmin = roles?.some((r) => r.role === "admin");
      const isEmployer = roles?.some((r) => r.role === "employer");

      console.log("User roles:", { isAdmin, isEmployer, roles, company });

      // Show debug info if no role or company found
      if (!isAdmin && !isEmployer && !company) {
        // Candidate role - redirect to bewerber dashboard
        toast({
          title: "Erfolgreich angemeldet!",
          description: "Willkommen zurück.",
        });
        await refreshAuth();
        navigate("/bewerber-dashboard", { replace: true });
        return;
      }

      toast({
        title: "Erfolgreich angemeldet!",
        description: "Willkommen zurück.",
      });

      await refreshAuth();

      if (isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else if (isEmployer || company) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/bewerber-dashboard", { replace: true });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const newCount = failCount + 1;
      setFailCount(newCount);
      
      const isRateLimited = error.message?.toLowerCase().includes("rate") || error.status === 429;
      
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: isRateLimited
          ? "Zu viele Versuche. Supabase hat den Zugang vorübergehend gesperrt. Bitte warten Sie einige Minuten."
          : "E-Mail oder Passwort falsch. Bitte prüfen Sie Ihre Eingaben.",
        variant: "destructive",
      });

      if (newCount >= 5 && !isRateLimited) {
        setDebugInfo(
          "Sie haben mehrfach ein falsches Passwort eingegeben. Nach weiteren Fehlversuchen wird Ihr Zugang vorübergehend durch ein automatisches Ratelimit gesperrt."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 bg-secondary/20">
        <div className="container">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <LogIn className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Anmelden</CardTitle>
              <CardDescription>
                Melden Sie sich in Ihrem Konto an.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {debugInfo && (
                <Alert className="mb-4 border-orange-300 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    {debugInfo}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="ihre@email.de"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Passwort</Label>
                    <Link
                      to="/passwort-vergessen"
                      className="text-xs text-primary hover:underline"
                    >
                      Passwort vergessen?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    placeholder="Ihr Passwort"
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Wird angemeldet...
                    </>
                  ) : (
                    <>
                      Anmelden
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Noch kein Konto?{" "}
                    <Link to="/register-employer" className="text-primary font-medium hover:underline">
                      Als Kanzlei registrieren
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
