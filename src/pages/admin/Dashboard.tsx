import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import StatCards from "@/components/admin/StatCards";
import ApplicationFilters from "@/components/admin/ApplicationFilters";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import ApplicationDetailsModal from "@/components/admin/ApplicationDetailsModal";
import CompanyManagement from "@/components/admin/CompanyManagement";
import JobManagement from "@/components/admin/JobManagement";
import ArticleManagement from "@/components/admin/ArticleManagement";
import LeadManagement from "@/components/admin/LeadManagement";
import { toast } from "sonner";

interface ApplicationWithJob {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  applicant_role: string | null;
  experience: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  status: string | null;
  created_at: string | null;
  is_archived: boolean;
  jobs: {
    id: string;
    title: string;
    company: string;
    company_id: string | null;
    employment_type: string | null;
    location: string | null;
  } | null;
}

interface Job {
  id: string;
  title: string;
  employment_type: string | null;
  is_active: boolean | null;
}

const AdminDashboardContent = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithJob | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [navigateToCompanyId, setNavigateToCompanyId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Realtime: toast on new contact lead
  useEffect(() => {
    const channel = supabase
      .channel("admin-new-leads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contact_leads" },
        (payload) => {
          const lead = payload.new as { full_name?: string };
          toast.info(`Neue Kontaktanfrage von ${lead.full_name || "Unbekannt"}`, {
            description: "Posteingang wurde aktualisiert.",
            duration: 8000,
          });
          queryClient.invalidateQueries({ queryKey: ["admin-contact-leads"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch applications
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["admin-dashboard-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          applicant_role,
          experience,
          cover_letter,
          resume_url,
          status,
          created_at,
          is_archived,
          jobs (
            id,
            title,
            company,
            company_id,
            employment_type,
            location
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ApplicationWithJob[];
    },
  });

  // Fetch jobs for filter
  const { data: jobs } = useQuery({
    queryKey: ["admin-dashboard-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, employment_type, is_active")
        .order("title");
      if (error) throw error;
      return data as Job[];
    },
  });

  // Fetch companies for filter
  const { data: companies } = useQuery({
    queryKey: ["admin-dashboard-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("applications")
        .update({ is_archived: true })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-applications"] });
      toast.success("Bewerbung archiviert");
      setModalOpen(false);
    },
    onError: () => {
      toast.error("Fehler beim Archivieren");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-applications"] });
      toast.success("Bewerbung gelöscht");
      setModalOpen(false);
    },
    onError: () => {
      toast.error("Fehler beim Löschen");
    },
  });

  // Restore mutation (for archived items)
  const restoreMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("applications")
        .update({ is_archived: false })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-applications"] });
      toast.success("Bewerbung wiederhergestellt");
      setModalOpen(false);
    },
    onError: () => {
      toast.error("Fehler beim Wiederherstellen");
    },
  });

  // Calculate stats (only active applications)
  const stats = useMemo(() => {
    if (!applications || !jobs) {
      return { total: 0, newToday: 0, openPositions: 0 };
    }

    const activeApps = applications.filter((app) => !app.is_archived);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newToday = activeApps.filter((app) => {
      if (!app.created_at) return false;
      const createdAt = new Date(app.created_at);
      return createdAt >= today;
    }).length;

    const openPositions = jobs.filter((job) => job.is_active).length;

    return {
      total: activeApps.length,
      newToday,
      openPositions,
    };
  }, [applications, jobs]);

  // Filter applications by tab and filters
  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    return applications.filter((app) => {
      const isArchived = app.is_archived ?? false;
      if (activeTab === "active" && isArchived) return false;
      if (activeTab === "archived" && !isArchived) return false;

      if (selectedJob !== "all" && app.jobs?.id !== selectedJob) return false;
      if (selectedType !== "all" && app.jobs?.employment_type !== selectedType) return false;
      if (selectedCompany !== "all" && app.jobs?.company_id !== selectedCompany) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = [app.first_name, app.last_name].filter(Boolean).join(" ").toLowerCase();
        const email = (app.email || "").toLowerCase();
        if (!fullName.includes(q) && !email.includes(q)) return false;
      }

      return true;
    });
  }, [applications, activeTab, selectedJob, selectedType, selectedCompany, searchQuery]);

  const handleViewDetails = (application: ApplicationWithJob) => {
    setSelectedApplication(application);
    setModalOpen(true);
  };

  const archivedCount = applications?.filter((app) => app.is_archived).length ?? 0;
  const activeCount = applications?.filter((app) => !app.is_archived).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader onNavigateToCompany={(id) => setNavigateToCompanyId(id)} />
      
      <div className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Übersicht aller Bewerbungen und Kanzleien
          </p>
        </div>

        {/* Stats Cards */}
        {applicationsLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : (
          <StatCards
            totalApplications={stats.total}
            newToday={stats.newToday}
            openPositions={stats.openPositions}
          />
        )}

        {/* Applications Card with Tabs */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              Bewerbungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-[300px] grid-cols-2">
                <TabsTrigger value="active">
                  Aktiv ({activeCount})
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Archiviert ({archivedCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-6 mt-6">
                {/* Filters */}
                {jobs && (
                  <ApplicationFilters
                    jobs={jobs}
                    companies={companies}
                    selectedJob={selectedJob}
                    selectedType={selectedType}
                    selectedCompany={selectedCompany}
                    searchQuery={searchQuery}
                    onJobChange={setSelectedJob}
                    onTypeChange={setSelectedType}
                    onCompanyChange={setSelectedCompany}
                    onSearchChange={setSearchQuery}
                    onReset={() => { setSelectedJob("all"); setSelectedType("all"); setSelectedCompany("all"); setSearchQuery(""); }}
                  />
                )}

                {/* Table */}
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <ApplicationsTable
                    applications={filteredApplications}
                    onViewDetails={handleViewDetails}
                  />
                )}
              </TabsContent>

              <TabsContent value="archived" className="space-y-6 mt-6">
                {/* Filters */}
                {jobs && (
                  <ApplicationFilters
                    jobs={jobs}
                    companies={companies}
                    selectedJob={selectedJob}
                    selectedType={selectedType}
                    selectedCompany={selectedCompany}
                    searchQuery={searchQuery}
                    onJobChange={setSelectedJob}
                    onTypeChange={setSelectedType}
                    onCompanyChange={setSelectedCompany}
                    onSearchChange={setSearchQuery}
                    onReset={() => { setSelectedJob("all"); setSelectedType("all"); setSelectedCompany("all"); setSearchQuery(""); }}
                  />
                )}

                {/* Table */}
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <ApplicationsTable
                    applications={filteredApplications}
                    onViewDetails={handleViewDetails}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Job Management */}
        <JobManagement />

        {/* Lead Management / Posteingang */}
        <LeadManagement />

        {/* Blog Management */}
        <ArticleManagement />

        {/* Company Management */}
        <CompanyManagement navigateToCompanyId={navigateToCompanyId} onNavigated={() => setNavigateToCompanyId(null)} />

        {/* Details Modal */}
        <ApplicationDetailsModal
          application={selectedApplication}
          open={modalOpen}
          onOpenChange={setModalOpen}
          isArchived={activeTab === "archived"}
          onArchive={
            activeTab === "active"
              ? (id) => archiveMutation.mutate(id)
              : (id) => restoreMutation.mutate(id)
          }
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <AdminAuthGuard>
      <AdminDashboardContent />
    </AdminAuthGuard>
  );
};

export default AdminDashboard;
