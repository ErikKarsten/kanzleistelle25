import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import ApplicationFilters from "@/components/admin/ApplicationFilters";
import ApplicationDetailsModal from "@/components/admin/ApplicationDetailsModal";
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
    title: string;
    company: string;
    employment_type: string | null;
    location: string | null;
  } | null;
}

const AdminApplicationsContent = () => {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<ApplicationWithJob | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const { data: applications, isLoading, error } = useQuery({
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
            title,
            company,
            employment_type,
            location
          )
        `)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ApplicationWithJob[];
    },
  });

  // Get unique jobs for filter
  const uniqueJobs = applications
    ? Array.from(
        new Map(
          applications
            .filter((a) => a.jobs)
            .map((a) => [a.jobs!.title, { id: a.jobs!.title, title: a.jobs!.title, employment_type: a.jobs!.employment_type }])
        ).values()
      )
    : [];

  // Filter applications
  const filtered = applications?.filter((app) => {
    if (selectedJob !== "all" && app.jobs?.title !== selectedJob) return false;
    if (selectedType !== "all" && app.jobs?.employment_type !== selectedType) return false;
    return true;
  }) ?? [];

  const handleViewDetails = (app: ApplicationWithJob) => {
    setSelectedApp(app);
    setDetailsOpen(true);
  };

  const handleArchive = async (id: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ is_archived: true })
      .eq("id", id);

    if (error) {
      toast.error("Archivierung fehlgeschlagen");
      return;
    }
    toast.success("Bewerbung archiviert");
    setDetailsOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-applications"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Löschen fehlgeschlagen");
      return;
    }
    toast.success("Bewerbung gelöscht");
    setDetailsOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-applications"] });
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl">
        <AdminNav />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Eingegangene Bewerbungen
              {applications && (
                <Badge variant="secondary" className="ml-2">
                  {filtered.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <ApplicationFilters
              jobs={uniqueJobs}
              selectedJob={selectedJob}
              selectedType={selectedType}
              onJobChange={setSelectedJob}
              onTypeChange={setSelectedType}
            />

            {error ? (
              <p className="text-center text-muted-foreground py-8">
                Fehler beim Laden der Bewerbungen.
              </p>
            ) : isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <ApplicationsTable
                applications={filtered}
                onViewDetails={handleViewDetails}
              />
            )}
          </CardContent>
        </Card>

        <ApplicationDetailsModal
          application={selectedApp}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

const AdminApplications = () => {
  return (
    <AdminAuthGuard>
      <AdminApplicationsContent />
    </AdminAuthGuard>
  );
};

export default AdminApplications;
