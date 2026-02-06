import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

interface JobWithCompany {
  id: string;
  title: string;
  company: string;
  company_id: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  requirements: string | null;
  salary_min: number | null;
  salary_max: number | null;
  is_active: boolean | null;
  created_at: string | null;
  companies: {
    name: string;
  } | null;
}

interface ApplicationCount {
  job_id: string;
  count: number;
}

const JobManagement = () => {
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
          description,
          requirements,
          salary_min,
          salary_max,
          is_active,
          created_at,
          companies (
            name
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

  // Calculate stats
  const stats = useMemo(() => {
    if (!jobs || !applicationCounts) {
      return { activeJobs: 0, jobsWithoutApps: 0, popularJob: null as string | null };
    }

    const activeJobs = jobs.filter((job) => job.is_active).length;

    const jobsWithoutApps = jobs.filter(
      (job) => job.is_active && (!applicationCounts[job.id] || applicationCounts[job.id] === 0)
    ).length;

    // Find most popular job
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

    return { activeJobs, jobsWithoutApps, popularJob };
  }, [jobs, applicationCounts]);

  const handleJobClick = (job: JobWithCompany) => {
    setSelectedJob(job);
    setDetailsOpen(true);
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
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Stellenanzeigen-Verwaltung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
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

          {/* Jobs Table */}
          {jobs && jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Noch keine Stellenanzeigen vorhanden.
              </p>
            </div>
          ) : (
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
                    <TableHead className="font-semibold text-right">
                      Aktionen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs?.map((job) => (
                    <TableRow key={job.id} className="hover:bg-muted/30">
                      <TableCell>
                        <button
                          onClick={() => handleJobClick(job)}
                          className="font-medium text-primary hover:underline text-left"
                        >
                          {job.title}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {job.companies?.name || job.company}
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
                          ? format(new Date(job.created_at), "dd.MM.yyyy", {
                              locale: de,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {applicationCounts?.[job.id] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            job.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {job.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={job.is_active ?? false}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({
                                jobId: job.id,
                                isActive: checked,
                              })
                            }
                            aria-label="Status umschalten"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleJobClick(job)}
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
                                <AlertDialogTitle>
                                  Stelle löschen?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Diese Aktion kann nicht rückgängig gemacht
                                  werden. Die Stelle "{job.title}" wird
                                  unwiderruflich gelöscht.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(job.id)}
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
          )}
        </CardContent>
      </Card>

      <JobDetailsModal
        job={selectedJob}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </>
  );
};

export default JobManagement;
