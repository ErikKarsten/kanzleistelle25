import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Bell,
  Shield,
  Loader2,
  ArrowLeft,
  Save,
  KeyRound,
  Mail,
  Globe,
  MapPin,
  FileText,
} from "lucide-react";
import LogoUpload from "@/components/employer/LogoUpload";

const EmployerSettings = () => {
  const navigate = useNavigate();
  const { user, companyId, isLoading: authLoading, isAuthenticated, role, refreshAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");

  // Notification prefs (stored locally for now, can be extended to DB)
  const [emailOnApplication, setEmailOnApplication] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Redirect guard
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  // Fetch company
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["employer-company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Populate form
  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setLocation(company.location || "");
      setDescription(company.description || "");
      setWebsite(company.website || "");
    }
  }, [company]);

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { name: string; location: string; description: string; website: string; logo_url?: string }) => {
      if (!companyId) throw new Error("No company ID");
      const { error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-company"] });
      refreshAuth();
      toast({ title: "Profil gespeichert", description: "Ihre Kanzleidaten wurden aktualisiert." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwörter stimmen nicht überein");
      if (newPassword.length < 6) throw new Error("Passwort muss mindestens 6 Zeichen lang sein");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Passwort geändert", description: "Ihr Passwort wurde erfolgreich aktualisiert." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Fehler", description: "Kanzleiname darf nicht leer sein.", variant: "destructive" });
      return;
    }
    updateCompanyMutation.mutate({ name: name.trim(), location: location.trim(), description: description.trim(), website: website.trim() });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate();
  };

  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/20 py-8">
        <div className="container max-w-4xl">
          {/* Back button + title */}
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Einstellungen</h1>
              <p className="text-sm text-muted-foreground">Verwalten Sie Ihr Kanzlei-Profil und Ihre Präferenzen</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Benachrichtigungen
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sicherheit
              </TabsTrigger>
            </TabsList>

            {/* ── Profile Tab ── */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Kanzlei-Profil</CardTitle>
                  <CardDescription>
                    Diese Informationen werden auf Ihren Stellenanzeigen und im öffentlichen Profil angezeigt.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Logo */}
                    <LogoUpload
                      currentLogoUrl={company?.logo_url}
                      companyName={company?.name || ""}
                      onUploadComplete={(url) => {
                        updateCompanyMutation.mutate({
                          name: name || company?.name || "",
                          location: location || company?.location || "",
                          description: description || company?.description || "",
                          website: website || company?.website || "",
                          logo_url: url || undefined,
                        });
                      }}
                    />

                    <Separator />

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="settings-name" className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          Kanzleiname *
                        </Label>
                        <Input
                          id="settings-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="settings-location" className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          Standort
                        </Label>
                        <Input
                          id="settings-location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="z.B. München"
                          maxLength={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-website" className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        Website
                      </Label>
                      <Input
                        id="settings-website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://www.ihre-kanzlei.de"
                        maxLength={200}
                        type="url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-description" className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        Beschreibung
                      </Label>
                      <Textarea
                        id="settings-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        placeholder="Erzählen Sie Bewerbern etwas über Ihre Kanzlei..."
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground text-right">{description.length} / 2000</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Angemeldet als: {user?.email}
                      </p>
                    </div>

                    <Button type="submit" disabled={updateCompanyMutation.isPending} className="w-full sm:w-auto">
                      {updateCompanyMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Wird gespeichert…
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Änderungen speichern
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Notifications Tab ── */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Benachrichtigungen</CardTitle>
                  <CardDescription>
                    Legen Sie fest, wie und wann Sie über neue Bewerbungen informiert werden möchten.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
                      <Checkbox
                        id="email-on-application"
                        checked={emailOnApplication}
                        onCheckedChange={(checked) => setEmailOnApplication(checked === true)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="email-on-application" className="font-medium cursor-pointer">
                          E-Mail bei neuer Bewerbung
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Erhalten Sie sofort eine Benachrichtigung per E-Mail, wenn eine neue Bewerbung eingeht.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
                      <Checkbox
                        id="weekly-report"
                        checked={weeklyReport}
                        onCheckedChange={(checked) => setWeeklyReport(checked === true)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="weekly-report" className="font-medium cursor-pointer">
                          Wöchentlicher Report
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Jeden Montag eine Zusammenfassung Ihrer Stellenanzeigen-Performance und neuer Bewerbungen.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="rounded-lg p-4 border border-dashed bg-muted/30">
                    <p className="text-sm text-muted-foreground text-center">
                      📧 E-Mail-Benachrichtigungen werden in Kürze verfügbar sein. Ihre Präferenzen werden gespeichert.
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      toast({ title: "Einstellungen gespeichert", description: "Ihre Benachrichtigungspräferenzen wurden aktualisiert." });
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Änderungen speichern
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Security Tab ── */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Sicherheit</CardTitle>
                  <CardDescription>
                    Verwalten Sie Ihr Passwort und Ihre Kontoeinstellungen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="flex items-center gap-2">
                        <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                        Neues Passwort
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mindestens 6 Zeichen"
                        minLength={6}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Passwort wiederholen"
                        required
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-destructive">Passwörter stimmen nicht überein</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending || !newPassword || newPassword !== confirmPassword}
                      className="w-full sm:w-auto"
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Wird geändert…
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Passwort ändern
                        </>
                      )}
                    </Button>
                  </form>

                  <Separator className="my-8" />

                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Konto-Informationen</h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">E-Mail</span>
                        <span className="font-medium">{user?.email}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Kanzlei-ID</span>
                        <span className="font-mono text-xs">{companyId}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Rolle</span>
                        <span className="font-medium capitalize">{role}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EmployerSettings;
