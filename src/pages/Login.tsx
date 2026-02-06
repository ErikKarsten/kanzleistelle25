import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Check user roles to determine redirect
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const isAdmin = roles?.some((r) => r.role === "admin");
      const isEmployer = roles?.some((r) => r.role === "employer");

      toast({
        title: "Erfolgreich angemeldet!",
        description: "Willkommen zurück.",
      });

      // Redirect based on role
      if (isAdmin) {
        navigate("/admin/dashboard");
      } else if (isEmployer) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message === "Invalid login credentials"
          ? "E-Mail oder Passwort ist falsch."
          : error.message || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
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
                <LogIn className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Anmelden</CardTitle>
              <CardDescription>
                Melden Sie sich in Ihrem Konto an.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  {isLoading ? "Wird angemeldet..." : "Anmelden"}
                  <ArrowRight className="h-5 w-5 ml-2" />
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
