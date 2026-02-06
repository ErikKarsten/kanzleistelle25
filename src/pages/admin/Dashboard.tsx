import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import StatCards from "@/components/admin/StatCards";
import ApplicationFilters from "@/components/admin/ApplicationFilters";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import ApplicationDetailsModal from "@/components/admin/ApplicationDetailsModal";

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
  jobs: {
    id: string;
    title: string;
    company: string;
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
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithJob | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
          jobs (
            id,
            title,
            company,
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

  // Calculate stats
  const stats = useMemo(() => {
    if (!applications || !jobs) {
      return { total: 0, newToday: 0, openPositions: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newToday = applications.filter((app) => {
      if (!app.created_at) return false;
      const createdAt = new Date(app.created_at);
      return createdAt >= today;
    }).length;

    const openPositions = jobs.filter((job) => job.is_active).length;

    return {
      total: applications.length,
      newToday,
      openPositions,
    };
  }, [applications, jobs]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    return applications.filter((app) => {
      // Filter by job
      if (selectedJob !== "all" && app.jobs?.id !== selectedJob) {
        return false;
      }

      // Filter by employment type
      if (selectedType !== "all" && app.jobs?.employment_type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [applications, selectedJob, selectedType]);

  const handleViewDetails = (application: ApplicationWithJob) => {
    setSelectedApplication(application);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Übersicht aller Bewerbungen und Stellenanzeigen
          </p>
        </div>

        {/* Stats Cards */}
        {applicationsLoading ? (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <StatCards
              totalApplications={stats.total}
              newToday={stats.newToday}
              openPositions={stats.openPositions}
            />
          </div>
        )}

        {/* Applications Card */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              Bewerbungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            {jobs && (
              <ApplicationFilters
                jobs={jobs}
                selectedJob={selectedJob}
                selectedType={selectedType}
                onJobChange={setSelectedJob}
                onTypeChange={setSelectedType}
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
          </CardContent>
        </Card>

        {/* Details Modal */}
        <ApplicationDetailsModal
          application={selectedApplication}
          open={modalOpen}
          onOpenChange={setModalOpen}
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
