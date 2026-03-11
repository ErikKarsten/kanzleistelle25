import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
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
  XCircle,
  EuroIcon,
  Monitor,
  User,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { buildJobApprovedEmail } from "@/lib/emailTemplates";

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
    updated_at?: string | null;
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

const isPendingStatus = (status: string | null) =>
  status === "pending" || status === "pending_review";

const JobPreviewModal = ({
  job,
  open,
  onOpenChange,
  onDelete,
}: JobPreviewModalProps) => {
  const queryClient = useQueryClient();
  const [rejectionNote, setRejectionNote] = useState("");

  // Fetch contact person for this job's company
  const { data: contactPerson } = useQuery({
    queryKey: ["contact-person", job?.company_id],
    queryFn: async () => {
      if (!job?.company_id) return null;
      const { data } = await supabase
        .from("contact_persons")
        .select("name, email, phone, role")
        .eq("company_id", job.company_id)
        .eq("is_primary", true)
        .maybeSingle();
      return data;
    },
    enabled: !!job?.company_id,
  });

  // Fetch company email (user email from profiles via company user_id)
  const { data: companyData } = useQuery({
    queryKey: ["company-detail", job?.company_id],
    queryFn: async () => {
      if (!job?.company_id) return null;
      const { data } = await supabase
        .from("companies")
        .select("name, user_id, location, website")
        .eq("id", job.company_id)
        .maybeSingle();
      return data;
    },
    enabled: !!job?.company_id,
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile", companyData?.user_id],
    queryFn: async () => {
      if (!companyData?.user_id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", companyData.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!companyData?.user_id,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!job) return;
      const { error } = await supabase
        .from("jobs")
        .update({ status: "published", is_active: true })
        .eq("id", job.id);
      if (error) throw error;

      // Send approval email to company
      const companyName = job.companies?.name || job.company;
      const recipientEmail = companyProfile?.email || contactPerson?.email;

      if (recipientEmail) {
        const emailData = buildJobApprovedEmail({
          jobTitle: job.title,
          companyName,
        });

        await supabase.functions.invoke("send-contact-email", {
          body: {
            to: recipientEmail,
            subject: emailData.subject,
            html: emailData.html,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      toast.success("Stelle freigegeben und Kanzlei benachrichtigt ✓");
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

  const requirementsList: string[] = job.requirements
    ? job.requirements.split("\n").filter(Boolean)
    : [];

  const benefitsList: string[] = Array.isArray(job.benefits) ? job.benefits : [];

  const salaryDisplay =
    job.salary_range ||
    (job.salary_min && job.salary_max
      ? `${job.salary_min.toLocaleString("de-DE")} – ${job.salary_max.toLocaleString("de-DE")} €`
      : job.salary_min
        ? `ab ${job.salary_min.toLocaleString("de-DE")} €`
        : null);

  const isPending = isPendingStatus(job.status);

  // Detect if this is an update (was previously published)
  const isUpdate =
    job.status === "pending_review" &&
    job.updated_at &&
    job.created_at &&
    new Date(job.updated_at).getTime() - new Date(job.created_at).getTime() > 60000;

  // Helper for highlight class on changed content
  const highlightClass = isUpdate ? "bg-blue-50 rounded-md px-2 py-1 border-l-2 border-blue-300" : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base text-muted-foreground font-normal">
            <Briefcase className="h-4 w-4" />
            Detailvorschau — Stellenanzeige prüfen
            {isUpdate && (
              <Badge className="bg-blue-100 text-blue-800 border border-blue-300 text-xs ml-2">
                Update einer bestehenden Anzeige
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 space-y-5">
          {/* Status banner */}
          {isPending && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
              <Clock className="h-4 w-4 text-yellow-600 shrink-0" />
              Diese Stelle wartet auf Freigabe und ist noch nicht öffentlich sichtbar.
            </div>
          )}

          {/* Job Header */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="hidden sm:flex items-center justify-center p-6 bg-secondary/30 border-r border-border">
                <Avatar className="h-16 w-16 rounded-lg">
                  {logoUrl && <AvatarImage src={logoUrl} alt={companyName} className="object-cover" />}
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 p-5 sm:p-6">
                <div className={`flex flex-wrap items-start justify-between gap-3 mb-3 ${isUpdate ? highlightClass : ""}`}>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">{job.title}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {companyName}
                    </p>
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

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
              </div>
            </div>
          </div>

          {/* Full Description */}
          {job.description && (
            <div className={isUpdate ? highlightClass : ""}>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">Stellenbeschreibung</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {job.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {requirementsList.length > 0 && (
            <div className={isUpdate ? highlightClass : ""}>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">Anforderungen</h3>
              <ul className="space-y-1.5">
                {requirementsList.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {benefitsList.length > 0 && (
            <div className={isUpdate ? highlightClass : ""}>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">Benefits</h3>
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

          {/* Salary Details */}
          {(job.salary_min || job.salary_max || job.salary_range) && (
            <div className={isUpdate ? highlightClass : ""}>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">Gehalt</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {job.salary_min && <span>Min: {job.salary_min.toLocaleString("de-DE")} €</span>}
                {job.salary_max && <span>Max: {job.salary_max.toLocaleString("de-DE")} €</span>}
                {job.salary_range && <span>Range: {job.salary_range}</span>}
              </div>
            </div>
          )}

          <Separator />

          {/* Company Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Kanzlei-Informationen
            </h3>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">{companyName}</span>
              </div>
              {companyData?.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {companyData.location}
                </div>
              )}
              {companyData?.website && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Monitor className="h-3.5 w-3.5" />
                  <a href={companyData.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {companyData.website}
                  </a>
                </div>
              )}

              {contactPerson && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ansprechpartner</p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-foreground">{contactPerson.name}</span>
                    {contactPerson.role && (
                      <Badge variant="outline" className="text-[10px] py-0">{contactPerson.role}</Badge>
                    )}
                  </div>
                  {contactPerson.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <a href={`mailto:${contactPerson.email}`} className="text-primary hover:underline">
                        {contactPerson.email}
                      </a>
                    </div>
                  )}
                  {contactPerson.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {contactPerson.phone}
                    </div>
                  )}
                </div>
              )}

              {companyProfile?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Mail className="h-3.5 w-3.5" />
                  Konto-E-Mail: <a href={`mailto:${companyProfile.email}`} className="text-primary hover:underline">{companyProfile.email}</a>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="mt-4" />

        {/* Action buttons */}
        <div className="flex items-center justify-between px-6 pb-6 pt-4 gap-3">
          {/* Reject */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                <XCircle className="h-4 w-4 mr-2" />
                Ablehnen / Korrektur anfordern
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Anzeige ablehnen / Korrektur anfordern</AlertDialogTitle>
                <AlertDialogDescription>
                  Die Stelle „{job.title}" wird auf den Status „Korrektur erforderlich" gesetzt. Die Kanzlei wird per E-Mail benachrichtigt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Grund für Ablehnung / Korrekturwünsche</label>
                <Textarea
                  placeholder="Z.B.: Bitte die Gehaltsangabe präzisieren oder das Logo in höherer Auflösung hochladen..."
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  rows={4}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {rejectMutation.isPending ? "Wird abgelehnt..." : "Ablehnen & Kanzlei benachrichtigen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Approve */}
          {isPending && (
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 shadow-md"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {approveMutation.isPending ? "Wird freigegeben..." : "Anzeige freigeben"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobPreviewModal;
