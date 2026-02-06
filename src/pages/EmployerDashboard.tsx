import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerAuth } from "@/hooks/useEmployerAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  Users,
  Building2,
  Plus,
  Eye,
  Pencil,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import EmployerJobModal from "@/components/employer/EmployerJobModal";
import EmployerOnboarding from "@/components/employer/EmployerOnboarding";

const EmployerDashboard = () => {
  const { user, companyId, isLoading: authLoading, signOut } = useEmployerAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Fetch company data
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

  // Fetch jobs for this company - filter by company_id for data isolation
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["employer-jobs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch applications for this company's jobs
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["employer-applications", jobs],
    queryFn: async () => {
      if (!jobs || jobs.length === 0) return [];
      const jobIds = jobs.map((j) => j.id);
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(title)")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!jobs && jobs.length > 0,
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { name: string; location: string; description: string }) => {
      if (!companyId) throw new Error("No company ID");
      const { error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-company"] });
      toast({ title: "Profil aktualisiert!" });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle job status
  const toggleJobMutation = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: isActive })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
    },
  });

  // Update application status
  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-applications"] });
      toast({ title: "Status aktualisiert!" });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateCompanyMutation.mutate({
      name: formData.get("name") as string,
      location: formData.get("location") as string,
      description: formData.get("description") as string,
    });
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No company found - show onboarding
  if (!authLoading && user && !companyId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-secondary/20 py-12">
          <EmployerOnboarding userId={user.id} />
        </main>
        <Footer />
      </div>
    );
  }

  const activeJobs = jobs?.filter((j) => j.is_active) || [];
  const pendingApplications = applications?.filter((a) => a.status === "pending") || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-secondary/20 py-8">
        <div className="container">
          {/* Header with prominent CTA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Kanzlei-Dashboard
              </h1>
              <p className="text-muted-foreground">
                Willkommen, {company?.name || "Kanzlei"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                size="lg" 
                className="shadow-lg"
                onClick={() => { setSelectedJob(null); setJobModalOpen(true); }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Neue Stelle schalten
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{jobs?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Stellenanzeigen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeJobs.length}</p>
                    <p className="text-sm text-muted-foreground">Aktive Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{applications?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Bewerbungen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={pendingApplications.length > 0 ? "border-orange-300 bg-orange-50" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    pendingApplications.length > 0 ? "bg-orange-100" : "bg-muted"
                  }`}>
                    <AlertCircle className={`h-6 w-6 ${
                      pendingApplications.length > 0 ? "text-orange-600" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingApplications.length}</p>
                    <p className="text-sm text-muted-foreground">Neue Bewerbungen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Offene Stellen
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bewerbungen
                {pendingApplications.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {pendingApplications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Kanzlei-Profil
              </TabsTrigger>
            </TabsList>

            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Ihre Stellenanzeigen</CardTitle>
                    <CardDescription>
                      {activeJobs.length} aktive von {jobs?.length || 0} Stellen
                    </CardDescription>
                  </div>
                  <Button onClick={() => { setSelectedJob(null); setJobModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Stelle
                  </Button>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : jobs && jobs.length > 0 ? (
                    <div className="space-y-4">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                            job.is_active 
                              ? "hover:bg-secondary/50" 
                              : "bg-muted/30 opacity-75"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{job.title}</h3>
                              {!job.is_active && (
                                <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              {job.location && <span>{job.location}</span>}
                              {job.employment_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {job.employment_type}
                                </Badge>
                              )}
                              <span className="text-xs">
                                Erstellt: {format(new Date(job.created_at!), "dd.MM.yyyy", { locale: de })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Aktiv</span>
                              <Switch
                                checked={job.is_active || false}
                                onCheckedChange={(checked) =>
                                  toggleJobMutation.mutate({ jobId: job.id, isActive: checked })
                                }
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedJob(job); setJobModalOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                      <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Noch keine Stellenanzeigen</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Erstellen Sie Ihre erste Stellenanzeige und erreichen Sie qualifizierte Bewerber.
                      </p>
                      <Button size="lg" onClick={() => { setSelectedJob(null); setJobModalOpen(true); }}>
                        <Plus className="h-5 w-5 mr-2" />
                        Erste Stelle erstellen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Eingegangene Bewerbungen</CardTitle>
                  <CardDescription>
                    Bewerbungen auf Ihre Stellenanzeigen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : applications && applications.length > 0 ? (
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            app.status === "pending" 
                              ? "border-orange-200 bg-orange-50/50" 
                              : "hover:bg-secondary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">
                                  {app.first_name} {app.last_name}
                                </h3>
                                {app.status === "pending" && (
                                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                    Neu
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-primary mt-1">
                                {(app as any).jobs?.title || "Unbekannte Stelle"}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                                {app.email && (
                                  <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-primary">
                                    <Mail className="h-3 w-3" />
                                    {app.email}
                                  </a>
                                )}
                                {app.phone && (
                                  <a href={`tel:${app.phone}`} className="flex items-center gap-1 hover:text-primary">
                                    <Phone className="h-3 w-3" />
                                    {app.phone}
                                  </a>
                                )}
                                {app.resume_url && (
                                  <a
                                    href={app.resume_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-primary"
                                  >
                                    <FileText className="h-3 w-3" />
                                    Lebenslauf
                                  </a>
                                )}
                              </div>
                              {app.applicant_role && (
                                <Badge variant="secondary" className="mt-2">
                                  {app.applicant_role}
                                </Badge>
                              )}
                              {app.experience && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  <span className="font-medium">Erfahrung:</span> {app.experience}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Select
                                value={app.status || "pending"}
                                onValueChange={(value) =>
                                  updateApplicationStatusMutation.mutate({
                                    appId: app.id,
                                    status: value,
                                  })
                                }
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Neu</SelectItem>
                                  <SelectItem value="reviewing">In Prüfung</SelectItem>
                                  <SelectItem value="interview">Vorstellungsgespräch</SelectItem>
                                  <SelectItem value="accepted">Angenommen</SelectItem>
                                  <SelectItem value="rejected">Abgelehnt</SelectItem>
                                </SelectContent>
                              </Select>
                              {app.created_at && (
                                <p className="text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {format(new Date(app.created_at), "dd. MMM yyyy", {
                                    locale: de,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Noch keine Bewerbungen eingegangen.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Kanzlei-Profil bearbeiten</CardTitle>
                  <CardDescription>
                    Diese Informationen werden auf Ihren Stellenanzeigen angezeigt.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {companyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : company ? (
                    <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-xl">
                      <div className="space-y-2">
                        <Label htmlFor="name">Kanzleiname *</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={company.name}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Standort</Label>
                        <Input
                          id="location"
                          name="location"
                          defaultValue={company.location || ""}
                          placeholder="z.B. München"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                          id="description"
                          name="description"
                          defaultValue={company.description || ""}
                          rows={4}
                          placeholder="Erzählen Sie Bewerbern etwas über Ihre Kanzlei..."
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={updateCompanyMutation.isPending}
                      >
                        {updateCompanyMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Wird gespeichert...
                          </>
                        ) : (
                          "Profil speichern"
                        )}
                      </Button>
                    </form>
                  ) : (
                    <p className="text-muted-foreground">
                      Kein Kanzlei-Profil gefunden.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Job Modal */}
      <EmployerJobModal
        open={jobModalOpen}
        onOpenChange={setJobModalOpen}
        job={selectedJob}
        companyId={companyId}
        companyName={company?.name || ""}
      />
    </div>
  );
};

export default EmployerDashboard;
