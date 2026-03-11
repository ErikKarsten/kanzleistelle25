import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Briefcase,
  MapPin,
  Building2,
  Pencil,
  Trash2,
  TrendingUp,
  FileX,
  Star,
  Plus,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import JobDetailsModal from "./JobDetailsModal";
import JobCreateModal from "./JobCreateModal";
import JobPreviewModal from "./JobPreviewModal";

interface JobWithCompany {
  id: string;
  title: string;
  company: string;
  company_id: string | null;
  location: string | null;
  employment_type: string | null;
  working_model: string | null;
  description: string | null;
  requirements: string | null;
  benefits: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_range: string | null;
  is_active: boolean | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  companies: {
    name: string;
    logo_url: string | null;
    is_active: boolean;
  } | null;
}

const JobManagement = () => {
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const queryClient = useQueryClient();

  // Fetch jobs with company info
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          company,
          company_id,
          location,
          employment_type,
          working_model,
          description,
          requirements,
          benefits,
          salary_min,
          salary_max,
          salary_range,
          is_active,
          status,
          created_at,
          companies (
            name,
            logo_url,
            is_active
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as JobWithCompany[];
    },
  });

  // Fetch application counts per job
  const { data: applicationCounts } = useQuery({
    queryKey: ["job-application-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("job_id")
        .eq("is_archived", false);

      if (error) throw error;

      // Count applications per job
      const counts: Record<string, number> = {};
      data.forEach((app) => {
        if (app.job_id) {
          counts[app.job_id] = (counts[app.job_id] || 0) + 1;
        }
      });

      return counts;
    },
  });

  // Toggle job status mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: isActive })
        .eq("id", jobId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      toast.success(
        variables.isActive ? "Stelle aktiviert" : "Stelle deaktiviert"
      );
    },
    onError: () => {
      toast.error("Fehler beim Aktualisieren");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      toast.success("Stelle gelöscht");
      setDetailsOpen(false);
    },
    onError: () => {
      toast.error("Fehler beim Löschen");
    },
  });

  // Approve pending job mutation
  const approveMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "published", is_active: true })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      toast.success("Stelle freigegeben und veröffentlicht");
    },
    onError: () => {
      toast.error("Fehler beim Freigeben");
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!jobs || !applicationCounts) {
      return { activeJobs: 0, inactiveJobs: 0, pendingJobs: 0, jobsWithoutApps: 0, popularJob: null as string | null };
    }

    const activeJobs = jobs.filter((job) => job.is_active && job.status !== "pending").length;
    const inactiveJobs = jobs.filter((job) => !job.is_active && job.status !== "pending").length;
    const pendingJobs = jobs.filter((job) => job.status === "pending").length;

    const jobsWithoutApps = jobs.filter(
      (job) => job.is_active && (!applicationCounts[job.id] || applicationCounts[job.id] === 0)
    ).length;

    let maxCount = 0;
    let popularJobId: string | null = null;
    Object.entries(applicationCounts).forEach(([jobId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        popularJobId = jobId;
      }
    });

    const popularJob = popularJobId
      ? jobs.find((j) => j.id === popularJobId)?.title || null
      : null;

    return { activeJobs, inactiveJobs, pendingJobs, jobsWithoutApps, popularJob };
  }, [jobs, applicationCounts]);

  // Filter jobs by active tab
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    if (activeTab === "pending") return jobs.filter((job) => job.status === "pending");
    if (activeTab === "active") return jobs.filter((job) => job.is_active === true && job.status !== "pending");
    return jobs.filter((job) => (job.is_active === false || job.is_active === null) && job.status !== "pending");
  }, [jobs, activeTab]);

  const handleJobClick = (job: JobWithCompany) => {
    setSelectedJob(job);
    if (job.status === "pending") {
      setPreviewOpen(true);
    } else {
      setDetailsOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Stellenanzeigen-Verwaltung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Stellenanzeigen-Verwaltung
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neue Stelle
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">
                  {stats.pendingJobs}
                </p>
                <p className="text-sm text-yellow-600">Zur Freigabe</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {stats.activeJobs}
                </p>
                <p className="text-sm text-green-600">Aktive Stellen</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="p-2 bg-orange-100 rounded-full">
                <FileX className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {stats.jobsWithoutApps}
                </p>
                <p className="text-sm text-orange-600">Ohne Bewerbungen</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="p-2 bg-purple-100 rounded-full">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-purple-700 truncate max-w-[150px]">
                  {stats.popularJob || "—"}
                </p>
                <p className="text-sm text-purple-600">Beliebteste Stelle</p>
              </div>
            </div>
          </div>

          {/* Tabs for Pending/Active/Inactive */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-[420px] grid-cols-3">
              <TabsTrigger value="pending" className="relative">
                Freigabe ({stats.pendingJobs})
                {stats.pendingJobs > 0 && (
                  <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-yellow-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="active">
                Aktiv ({stats.activeJobs})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inaktiv ({stats.inactiveJobs})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <PendingJobsTable
                jobs={filteredJobs}
                onPreview={(job) => { setSelectedJob(job); setPreviewOpen(true); }}
                onApprove={(jobId) => approveMutation.mutate(jobId)}
                onDelete={(jobId) => deleteMutation.mutate(jobId)}
              />
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <JobsTable
                jobs={filteredJobs}
                applicationCounts={applicationCounts}
                onJobClick={handleJobClick}
                onToggle={(jobId, isActive) => toggleMutation.mutate({ jobId, isActive })}
                onDelete={(jobId) => deleteMutation.mutate(jobId)}
              />
            </TabsContent>

            <TabsContent value="inactive" className="mt-6">
              <JobsTable
                jobs={filteredJobs}
                applicationCounts={applicationCounts}
                onJobClick={handleJobClick}
                onToggle={(jobId, isActive) => toggleMutation.mutate({ jobId, isActive })}
                onDelete={(jobId) => deleteMutation.mutate(jobId)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <JobDetailsModal
        job={selectedJob}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <JobPreviewModal
        job={selectedJob}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDelete={(id) => { deleteMutation.mutate(id); setPreviewOpen(false); }}
      />

      <JobCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
};

// Extracted table component for reuse
interface JobsTableProps {
  jobs: JobWithCompany[];
  applicationCounts: Record<string, number> | undefined;
  onJobClick: (job: JobWithCompany) => void;
  onToggle: (jobId: string, isActive: boolean) => void;
  onDelete: (jobId: string) => void;
}

const JobsTable = ({
  jobs,
  applicationCounts,
  onJobClick,
  onToggle,
  onDelete,
}: JobsTableProps) => {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Keine Stellenanzeigen in dieser Kategorie.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Job-Titel</TableHead>
            <TableHead className="font-semibold">Kanzlei</TableHead>
            <TableHead className="font-semibold">Standort</TableHead>
            <TableHead className="font-semibold">Veröffentlicht</TableHead>
            <TableHead className="font-semibold">Bewerbungen</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className="hover:bg-muted/40 cursor-pointer transition-colors" onClick={() => onJobClick(job)}>
              <TableCell>
                <button
                  onClick={() => onJobClick(job)}
                  className="font-medium text-primary hover:underline text-left"
                >
                  {job.title}
                </button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {job.companies?.name || "Kanzleihafen (Allgemein)"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {job.location || "Remote"}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {job.created_at
                  ? format(new Date(job.created_at), "dd.MM.yyyy", { locale: de })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{applicationCounts?.[job.id] || 0}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    className={
                      job.is_active
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300"
                    }
                  >
                    {job.is_active ? "🟢 Live" : "⭕ Inaktiv"}
                  </Badge>
                  {job.status === "published" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                      ✨ Freigegeben
                    </span>
                  )}
                  {!job.is_active && job.companies && !job.companies.is_active && (
                    <Badge variant="outline" className="text-xs border-destructive text-destructive">
                      🚫 Kanzlei gesperrt
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={job.is_active ?? false}
                    onCheckedChange={(checked) => onToggle(job.id, checked)}
                    aria-label="Status umschalten"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onJobClick(job)}
                    title="Bearbeiten"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Stelle löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Aktion kann nicht rückgängig gemacht werden. Die
                          Stelle "{job.title}" wird unwiderruflich gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(job.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Endgültig löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Pending jobs approval table
interface PendingJobsTableProps {
  jobs: JobWithCompany[];
  onPreview: (job: JobWithCompany) => void;
  onApprove: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

const PendingJobsTable = ({ jobs, onPreview, onApprove, onDelete }: PendingJobsTableProps) => {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <p className="text-muted-foreground">Keine Stellen zur Freigabe.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-yellow-50">
            <TableHead className="font-semibold">Job-Titel</TableHead>
            <TableHead className="font-semibold">Kanzlei</TableHead>
            <TableHead className="font-semibold">Standort</TableHead>
            <TableHead className="font-semibold">Eingereicht</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow
              key={job.id}
              className="hover:bg-yellow-50/70 cursor-pointer transition-colors"
              onClick={() => onPreview(job)}
            >
              <TableCell>
                <div className="font-medium text-primary hover:underline">{job.title}</div>
                {job.employment_type && (
                  <Badge variant="secondary" className="text-xs mt-1">{job.employment_type}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {job.companies?.name || "Kanzleihafen (Allgemein)"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {job.location || "Nicht angegeben"}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {job.created_at
                  ? format(new Date(job.created_at), "dd.MM.yyyy", { locale: de })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Wartet
                </Badge>
              </TableCell>
              <TableCell>
                <div
                  className="flex items-center justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    onClick={() => onApprove(job.id)}
                    className="bg-primary text-primary-foreground"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Freigeben
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Stelle ablehnen & löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Die Stelle „{job.title}" wird unwiderruflich gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(job.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Endgültig löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobManagement;

