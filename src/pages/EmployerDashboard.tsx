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
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import EmployerJobModal from "@/components/employer/EmployerJobModal";

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

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateCompanyMutation.mutate({
      name: formData.get("name") as string,
      location: formData.get("location") as string,
      description: formData.get("description") as string,
    });
  };

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

      <main className="flex-1 bg-secondary/20 py-8">
        <div className="container">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Kanzlei-Dashboard
              </h1>
              <p className="text-muted-foreground">
                Willkommen, {company?.name || "Kanzlei"}
              </p>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
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
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {jobs?.filter((j) => j.is_active).length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Aktive Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{applications?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Bewerbungen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Meine Jobs
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bewerbungen
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
                    <CardTitle>Meine Stellenanzeigen</CardTitle>
                    <CardDescription>
                      Verwalten Sie Ihre offenen Positionen
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
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{job.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              {job.location && <span>{job.location}</span>}
                              {job.employment_type && (
                                <Badge variant="outline" className="text-xs">
                                  {job.employment_type}
                                </Badge>
                              )}
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
                    <div className="text-center py-12">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Sie haben noch keine Stellenanzeigen erstellt.
                      </p>
                      <Button onClick={() => { setSelectedJob(null); setJobModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
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
                          className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {app.first_name} {app.last_name}
                              </h3>
                              <p className="text-sm text-primary mt-1">
                                {(app as any).jobs?.title || "Unbekannte Stelle"}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                {app.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {app.email}
                                  </span>
                                )}
                                {app.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {app.phone}
                                  </span>
                                )}
                              </div>
                              {app.applicant_role && (
                                <Badge variant="secondary" className="mt-2">
                                  {app.applicant_role}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  app.status === "pending"
                                    ? "outline"
                                    : app.status === "accepted"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {app.status === "pending"
                                  ? "Neu"
                                  : app.status === "accepted"
                                  ? "Angenommen"
                                  : app.status === "rejected"
                                  ? "Abgelehnt"
                                  : app.status}
                              </Badge>
                              {app.created_at && (
                                <p className="text-xs text-muted-foreground mt-2">
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
