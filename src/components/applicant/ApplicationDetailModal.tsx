import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Briefcase,
  MessageCircle,
  Calendar,
  FileText,
  Building2,
  Euro,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface ApplicationDetailModalProps {
  application: any;
  companyLogo: string | null;
  statusLabel: string;
  statusClassName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChat: () => void;
}

const ApplicationDetailModal = ({
  application,
  companyLogo,
  statusLabel,
  statusClassName,
  open,
  onOpenChange,
  onOpenChat,
}: ApplicationDetailModalProps) => {
  const job = application?.jobs;

  const { data: jobDetail } = useQuery({
    queryKey: ["job-detail", application?.job_id],
    queryFn: async () => {
      if (!application?.job_id) return null;
      const { data, error } = await supabase
        .from("jobs")
        .select("*, companies(name, logo_url, location, website)")
        .eq("id", application.job_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: open && !!application?.job_id,
  });

  if (!application) return null;

  const detail = jobDetail || job;
  const company = jobDetail?.companies || null;
  const isWithdrawn = application.status === "withdrawn";

  const salaryMin = (detail as any)?.salary_min;
  const salaryMax = (detail as any)?.salary_max;
  const salaryRange = salaryMin || salaryMax
    ? `${salaryMin ? `${(salaryMin / 1000).toFixed(0)}k` : ""}${salaryMin && salaryMax ? " – " : ""}${salaryMax ? `${(salaryMax / 1000).toFixed(0)}k €` : " €"}`
    : null;

  const employmentTypeLabel: Record<string, string> = {
    vollzeit: "Vollzeit",
    teilzeit: "Teilzeit",
    minijob: "Minijob",
    werkstudent: "Werkstudent",
    praktikum: "Praktikum",
    freelance: "Freelance",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 rounded-xl border border-border shrink-0 shadow-sm">
                {companyLogo ? (
                  <AvatarImage src={companyLogo} alt={job?.company} className="object-cover" />
                ) : null}
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-base font-bold">
                  {(job?.company || "??").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold leading-tight text-foreground">
                  {detail?.title || job?.title || "Unbekannte Stelle"}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {job?.company}
                  {job?.location && ` · ${job.location}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Separator />

        <div className="p-6 space-y-5">
          {/* Status & Date */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={statusClassName}>{statusLabel}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Beworben am {application.created_at && format(new Date(application.created_at), "dd. MMMM yyyy", { locale: de })}
            </span>
          </div>

          {/* Job Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {job?.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary/60" />
                <span>{job.location}</span>
              </div>
            )}
            {(detail as any)?.employment_type && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 text-primary/60" />
                <span>{employmentTypeLabel[(detail as any).employment_type] || (detail as any).employment_type}</span>
              </div>
            )}
            {salaryRange && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Euro className="h-4 w-4 shrink-0 text-primary/60" />
                <span>{salaryRange}</span>
              </div>
            )}
            {company?.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0 text-primary/60" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  Website
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {(detail as any)?.description && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Stellenbeschreibung</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {(detail as any).description}
                </p>
              </div>
            </>
          )}

          {/* Requirements */}
          {(detail as any)?.requirements && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Anforderungen</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {(detail as any).requirements}
              </p>
            </div>
          )}

          {/* Benefits */}
          {(detail as any)?.benefits && (detail as any).benefits.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Benefits</h4>
              <div className="flex flex-wrap gap-1.5">
                {(detail as any).benefits.map((b: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Resume */}
          {application.resume_url && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <a
                  href={application.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Lebenslauf ansehen
                </a>
              </div>
            </>
          )}

          {/* Chat Button */}
          {!isWithdrawn && (
            <>
              <Separator />
              <Button
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(onOpenChat, 200);
                }}
                className="w-full"
                size="lg"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Nachricht an Kanzlei senden
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailModal;
