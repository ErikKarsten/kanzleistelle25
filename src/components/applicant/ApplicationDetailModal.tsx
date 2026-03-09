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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-lg border border-border shrink-0">
              {companyLogo ? (
                <AvatarImage src={companyLogo} alt={job?.company} className="object-cover" />
              ) : null}
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                {(job?.company || "??").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-tight">
                {detail?.title || job?.title || "Unbekannte Stelle"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                {job?.company}
                {job?.location && ` · ${job.location}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Status & Date */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={statusClassName}>{statusLabel}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Beworben am {application.created_at && format(new Date(application.created_at), "dd. MMMM yyyy", { locale: de })}
            </span>
          </div>

          <Separator />

          {/* Job Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Stellendetails</h4>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {job?.location && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{job.location}</span>
                </div>
              )}
              {(detail as any)?.employment_type && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  <span className="capitalize">{(detail as any).employment_type}</span>
                </div>
              )}
              {company?.website && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
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

            {(detail as any)?.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {(detail as any).description}
              </p>
            )}

            {(detail as any)?.benefits && (detail as any).benefits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(detail as any).benefits.map((b: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>
                ))}
              </div>
            )}
          </div>

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

          {!isWithdrawn && (
            <>
              <Separator />
              <Button
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(onOpenChat, 200);
                }}
                className="w-full"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat mit Kanzlei
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailModal;
