import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import {
  MapPin,
  Clock,
  Building2,
  Briefcase,
  CheckCircle,
  Trash2,
  EuroIcon,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface JobPreviewModalProps {
  job: {
    id: string;
    title: string;
    company: string;
    company_id: string | null;
    location: string | null;
    employment_type: string | null;
    working_model?: string | null;
    description: string | null;
    requirements: string | null;
    benefits?: string[] | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_range?: string | null;
    is_active: boolean | null;
    status: string | null;
    created_at: string | null;
    companies?: { name: string; logo_url?: string | null } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

const employmentTypeLabels: Record<string, string> = {
  vollzeit: "Vollzeit",
  teilzeit: "Teilzeit",
  minijob: "Minijob",
  freelance: "Freelance",
  praktikum: "Praktikum",
};

const workingModelLabels: Record<string, string> = {
  vor_ort: "Vor Ort",
  hybrid: "Hybrid",
  remote: "Remote",
};

const JobPreviewModal = ({
  job,
  open,
  onOpenChange,
  onDelete,
}: JobPreviewModalProps) => {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!job) return;
      const { error } = await supabase
        .from("jobs")
        .update({ status: "published", is_active: true })
        .eq("id", job.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      toast.success("Stelle freigegeben und veröffentlicht ✓");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Fehler beim Freigeben");
    },
  });

  if (!job) return null;

  const companyName = job.companies?.name || job.company;
  const logoUrl = job.companies?.logo_url;
  const initials = companyName.substring(0, 2).toUpperCase();

  // Parse requirements from newline-separated string or array
  const requirementsList: string[] = job.requirements
    ? job.requirements.split("\n").filter(Boolean)
    : [];

  const benefitsList: string[] = Array.isArray(job.benefits) ? job.benefits : [];

  const salaryDisplay =
    job.salary_range ||
    (job.salary_min && job.salary_max
      ? `${job.salary_min.toLocaleString("de-DE")} – ${job.salary_max.toLocaleString("de-DE")} €`
      : null);

  const isPending = job.status === "pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base text-muted-foreground font-normal">
            <Briefcase className="h-4 w-4" />
            Vorschau — so sieht die Stelle öffentlich aus
          </DialogTitle>
        </DialogHeader>

        {/* Public-style preview */}
        <div className="px-6 pt-4">
          {/* Status banner */}
          {isPending && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 mb-4">
              <Clock className="h-4 w-4 text-yellow-600 shrink-0" />
              Diese Stelle wartet auf Freigabe und ist noch nicht öffentlich sichtbar.
            </div>
          )}

          {/* Job Card Preview */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row">
              {/* Logo */}
              <div className="hidden sm:flex items-center justify-center p-6 bg-secondary/30 border-r border-border">
                <Avatar className="h-16 w-16 rounded-lg">
                  {logoUrl && <AvatarImage src={logoUrl} alt={companyName} className="object-cover" />}
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Details */}
              <div className="flex-1 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {/* Mobile logo */}
                    <Avatar className="h-10 w-10 rounded-lg sm:hidden">
                      {logoUrl && <AvatarImage src={logoUrl} alt={companyName} />}
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">{job.title}</h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {companyName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {job.employment_type && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {employmentTypeLabels[job.employment_type] || job.employment_type}
                      </Badge>
                    )}
                    {job.working_model && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        <Monitor className="h-3 w-3 mr-1" />
                        {workingModelLabels[job.working_model] || job.working_model}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                  {job.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary/70" />
                      {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary/70" />
                    {job.created_at
                      ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: de })
                      : "—"}
                  </span>
                  {salaryDisplay && (
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <EuroIcon className="h-4 w-4 text-primary/70" />
                      {salaryDisplay}
                    </span>
                  )}
                </div>

                {/* Description */}
                {job.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {job.description}
                  </p>
                )}
              </div>
            </div>

            {/* Requirements & Benefits */}
            {(requirementsList.length > 0 || benefitsList.length > 0) && (
              <>
                <Separator />
                <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-6">
                  {requirementsList.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Anforderungen
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {requirementsList.map((r) => (
                          <span
                            key={r}
                            className="px-3 py-1 rounded-full text-xs bg-secondary text-secondary-foreground border border-border"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {benefitsList.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Benefits
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {benefitsList.map((b) => (
                          <span
                            key={b}
                            className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <Separator className="mt-6" />

        {/* Action buttons */}
        <div className="flex items-center justify-between px-6 pb-6 pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Ablehnen / Löschen
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
                  onClick={() => { onDelete(job.id); onOpenChange(false); }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Endgültig löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isPending && (
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              size="lg"
              className="bg-primary text-primary-foreground px-8"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {approveMutation.isPending ? "Wird freigegeben..." : "Jetzt freigeben"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobPreviewModal;
