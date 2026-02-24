import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Users,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import EmployerJobModal from "./EmployerJobModal";

interface EmployerJobDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any | null;
  companyId: string | null;
  companyName: string;
  onOpenApplicant?: (app: any) => void;
}

const statusOptions = [
  { value: "pending", label: "Neu", className: "bg-orange-100 text-orange-700" },
  { value: "reviewing", label: "In Prüfung", className: "bg-blue-100 text-blue-700" },
  { value: "interview", label: "Eingeladen", className: "bg-purple-100 text-purple-700" },
  { value: "accepted", label: "Angenommen", className: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Abgesagt", className: "bg-red-100 text-red-700" },
];

const EmployerJobDetailsModal = ({
  open,
  onOpenChange,
  job,
  companyId,
  companyName,
  onOpenApplicant,
}: EmployerJobDetailsModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch applications for this specific job
  const { data: jobApplications, isLoading: appsLoading } = useQuery({
    queryKey: ["job-applications", job?.id],
    queryFn: async () => {
      if (!job?.id) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", job.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!job?.id && open,
  });

  // Quick status change
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", job?.id] });
      queryClient.invalidateQueries({ queryKey: ["employer-applications", companyId] });
      toast({ title: "Status aktualisiert!" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden", variant: "destructive" });
    },
  });

  const handleOpenResume = async (resumeUrl: string) => {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resumeUrl, 60);
    if (error) {
      toast({ title: "Fehler", description: "Lebenslauf konnte nicht geladen werden", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const appCount = jobApplications?.length || 0;

  if (!job) return null;

  // Parse requirements
  let requirementsList: string[] = [];
  if (job.requirements) {
    try {
      const parsed = JSON.parse(job.requirements);
      requirementsList = Array.isArray(parsed) ? parsed : job.requirements.split("\n").filter(Boolean);
    } catch {
      requirementsList = job.requirements.split("\n").filter(Boolean);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl">{job.title}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {job.location && <span>{job.location}</span>}
            {job.location && job.employment_type && <span>•</span>}
            {job.employment_type && <span className="capitalize">{job.employment_type}</span>}
            {job.salary_range && (
              <>
                <span>•</span>
                <span>{job.salary_range}</span>
              </>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-2 my-4">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Stellendetails
            </TabsTrigger>
            <TabsTrigger value="applicants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Bewerber
              {appCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs">
                  {appCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Stellendetails Tab ── */}
          <TabsContent value="details" className="space-y-6 mt-2">
            {/* Description */}
            {job.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Beschreibung</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>
            )}

            {/* Requirements */}
            {requirementsList.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Anforderungen</h3>
                <div className="flex flex-wrap gap-2">
                  {requirementsList.map((r, i) => (
                    <Badge key={i} variant="outline" className="text-sm">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map((b: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Working model & salary */}
            <div className="grid grid-cols-2 gap-4">
              {job.working_model && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Arbeitsmodell</h3>
                  <p className="text-sm text-muted-foreground capitalize mt-1">{job.working_model.replace("_", " ")}</p>
                </div>
              )}
              {job.salary_range && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Gehalt</h3>
                  <p className="text-sm text-muted-foreground mt-1">{job.salary_range}</p>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Erstellt am: {job.created_at ? format(new Date(job.created_at), "dd. MMMM yyyy", { locale: de }) : "—"}
              {" • "}Status: {job.is_active ? "Aktiv" : "Inaktiv"}
            </div>

            {/* Edit button → opens the existing EmployerJobModal */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                // Small delay so the modal closes first, then the edit modal opens
                setTimeout(() => {
                  // We dispatch a custom event the parent will listen to
                  window.dispatchEvent(new CustomEvent("open-job-edit", { detail: job }));
                }, 150);
              }}
            >
              Stelle bearbeiten
            </Button>
          </TabsContent>

          {/* ── Bewerber Tab ── */}
          <TabsContent value="applicants" className="mt-2">
            {appsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : jobApplications && jobApplications.length > 0 ? (
              <div className="space-y-3">
                {jobApplications.map((app) => {
                  const statusCfg = statusOptions.find((s) => s.value === app.status) || statusOptions[0];
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">
                            {app.first_name} {app.last_name}
                          </p>
                          <Badge variant="outline" className={`text-xs ${statusCfg.className}`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
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
                          {app.created_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(app.created_at), "dd. MMM yyyy", { locale: de })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="flex items-center gap-1 ml-3 shrink-0">
                        {app.resume_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Lebenslauf öffnen"
                            onClick={() => handleOpenResume(app.resume_url!)}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Einladen"
                          onClick={() => updateStatusMutation.mutate({ appId: app.id, status: "interview" })}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
                          title="Absagen"
                          onClick={() => updateStatusMutation.mutate({ appId: app.id, status: "rejected" })}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        {onOpenApplicant && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-1 h-8 text-xs"
                            onClick={() => {
                              onOpenApplicant({ ...app, jobs: { title: job.title } });
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Profil
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Noch keine Bewerbungen für diese Stelle.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EmployerJobDetailsModal;
