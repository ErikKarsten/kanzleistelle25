import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Building2,
  MapPin,
  Briefcase,
  Pencil,
  Globe,
  Mail,
  FileDown,
  Loader2,
  StickyNote,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Clock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import CompanyEditModal from "./CompanyEditModal";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  location: string | null;
  created_at: string | null;
  is_active: boolean;
  website: string | null;
  user_id: string | null;
  reactivation_requested: boolean;
  last_sign_in_at: string | null;
}

interface Job {
  id: string;
  title: string;
  employment_type: string | null;
  is_active: boolean | null;
  location: string | null;
}

interface Application {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_archived: boolean;
  jobs: { title: string } | null;
}

type SlaLevel = "ok" | "warning" | "urgent" | "critical";

const getSlaLevel = (app: Application): SlaLevel => {
  if (!app.created_at) return "ok";
  const isPending = !app.status || app.status === "pending" || app.status === "neu" || app.status === "eingegangen";
  if (!isPending) return "ok";
  const days = Math.floor((Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24));
  if (days >= 14) return "critical";
  if (days >= 7) return "urgent";
  if (days >= 3) return "warning";
  return "ok";
};

const SLA_LABEL: Record<SlaLevel, string> = {
  ok: "Im Rahmen",
  warning: "Erste Reaktion erforderlich",
  urgent: "Dringender Handlungsbedarf",
  critical: "Kritisch: Bewerberverlust droht",
};

const getDaysSinceCreation = (createdAt: string | null): number => {
  if (!createdAt) return 0;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
};

const calcAvgResponseTime = (applications: Application[]): number | null => {
  const responded = applications.filter((a) => {
    const isPending = !a.status || a.status === "pending" || a.status === "neu" || a.status === "eingegangen";
    return !isPending && a.created_at && a.updated_at;
  });
  if (responded.length === 0) return null;
  const total = responded.reduce((sum, a) => {
    const diff = new Date(a.updated_at!).getTime() - new Date(a.created_at!).getTime();
    return sum + diff;
  }, 0);
  return Math.round(total / responded.length / (1000 * 60 * 60 * 24) * 10) / 10;
};

const calcSlaCompliance = (applications: Application[]): number | null => {
  if (!applications || applications.length === 0) return null;
  const responded = applications.filter((a) => {
    const isPending = !a.status || a.status === "pending" || a.status === "neu" || a.status === "eingegangen";
    return !isPending && a.created_at && a.updated_at;
  });
  if (responded.length === 0) return null;
  const withinSla = responded.filter((a) => {
    const diff = new Date(a.updated_at!).getTime() - new Date(a.created_at!).getTime();
    return diff <= 3 * 24 * 60 * 60 * 1000;
  });
  return Math.round((withinSla.length / responded.length) * 100);
};

/** Returns the highest SLA level among a list of applications */
const getHighestSlaLevel = (apps: { status: string | null; created_at: string | null }[]): SlaLevel => {
  const levels: SlaLevel[] = ["ok", "warning", "urgent", "critical"];
  let highest = 0;
  for (const app of apps) {
    const isPending = !app.status || app.status === "pending" || app.status === "neu" || app.status === "eingegangen";
    if (!isPending || !app.created_at) continue;
    const days = Math.floor((Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24));
    let level = 0;
    if (days >= 14) level = 3;
    else if (days >= 7) level = 2;
    else if (days >= 3) level = 1;
    if (level > highest) highest = level;
    if (highest === 3) break;
  }
  return levels[highest];
};

interface CompanyDetailsModalProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

const CompanyDetailsModal = ({
  company,
  open,
  onOpenChange,
  onDelete,
}: CompanyDetailsModalProps) => {
  const [adminNotes, setAdminNotes] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (company) {
      supabase
        .from("companies")
        .select("admin_notes")
        .eq("id", company.id)
        .maybeSingle()
        .then(({ data }) => setAdminNotes(data?.admin_notes || ""));

      if (company.user_id) {
        supabase
          .from("profiles")
          .select("email")
          .eq("id", company.user_id)
          .maybeSingle()
          .then(({ data }) => setOwnerEmail(data?.email || null));
      } else {
        setOwnerEmail(null);
      }
    }
  }, [company]);

  const { data: jobs } = useQuery({
    queryKey: ["company-jobs", company?.id],
    queryFn: async () => {
      if (!company) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, employment_type, is_active, location")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Job[];
    },
    enabled: !!company,
  });

  // Fetch applications for this company
  const { data: applications } = useQuery({
    queryKey: ["company-applications", company?.id],
    queryFn: async () => {
      if (!company) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("id, first_name, last_name, email, status, created_at, updated_at, is_archived, jobs(title)")
        .eq("company_id", company.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Application[];
    },
    enabled: !!company,
  });

  const slaStats = useMemo(() => {
    if (!applications) return { warning: 0, urgent: 0, critical: 0, avgResponseTime: null as number | null, compliance: null as number | null };
    const warning = applications.filter((a) => getSlaLevel(a) === "warning").length;
    const urgent = applications.filter((a) => getSlaLevel(a) === "urgent").length;
    const critical = applications.filter((a) => getSlaLevel(a) === "critical").length;
    const avgResponseTime = calcAvgResponseTime(applications);
    const compliance = calcSlaCompliance(applications);
    return { warning, urgent, critical, avgResponseTime, compliance };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    if (!showOverdueOnly) return applications;
    return applications.filter((a) => getSlaLevel(a) !== "ok");
  }, [applications, showOverdueOnly]);

  const notesMutation = useMutation({
    mutationFn: async (notes: string) => {
      if (!company) return;
      const { error } = await supabase
        .from("companies")
        .update({ admin_notes: notes } as any)
        .eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    onError: () => {
      toast.error("Fehler beim Speichern der Notiz");
    },
  });

  const handleNotesChange = useCallback(
    (value: string) => {
      setAdminNotes(value);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        notesMutation.mutate(value);
      }, 1500);
    },
    [notesMutation]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleSaveNotes = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    notesMutation.mutate(adminNotes);
    toast.success("Notiz gespeichert");
  };

  // PDF Export
  const handleExportPDF = () => {
    if (!company) return;

    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Kanzlei-Dossier", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Erstellt am ${new Date().toLocaleDateString("de-DE")}`, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 14;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Stammdaten", margin, y);
    y += 8;

    const addField = (label: string, value: string) => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(label, margin, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(value || "—", 160);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    };

    addField("Kanzleiname", company.name);
    addField("Standort", company.location || "—");
    addField("Website", company.website || "—");
    addField("Status", company.is_active ? "Freigegeben" : "Gesperrt");
    addField("Inhaber E-Mail", ownerEmail || "Kein Nutzer zugewiesen");
    addField("Registriert am", company.created_at ? new Date(company.created_at).toLocaleDateString("de-DE") : "—");

    if (company.description) {
      y += 2;
      addField("Beschreibung", company.description);
    }

    // SLA Performance section
    y += 4;
    if (y > 240) { doc.addPage(); y = margin; }
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SLA-Performance", margin, y);
    y += 8;

    addField("Ø Reaktionszeit", slaStats.avgResponseTime !== null ? `${slaStats.avgResponseTime} Tage` : "Keine Daten");
    addField("SLA-Compliance (< 3 Tage)", slaStats.compliance !== null ? `${slaStats.compliance}%` : "Keine Daten");
    addField("Stufe 1 – Gelb (3+ Tage)", String(slaStats.warning));
    addField("Stufe 2 – Orange (7+ Tage)", String(slaStats.urgent));
    addField("Stufe 3 – Rot (14+ Tage)", String(slaStats.critical));

    // List overdue applications
    if (applications) {
      const overdue = applications.filter((a) => getSlaLevel(a) !== "ok");
      if (overdue.length > 0) {
        y += 2;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Überfällige Bewerbungen:", margin, y);
        y += 6;

        overdue.forEach((app) => {
          if (y > 265) { doc.addPage(); y = margin; }
          const level = getSlaLevel(app);
          const days = getDaysSinceCreation(app.created_at);
          const name = [app.first_name, app.last_name].filter(Boolean).join(" ") || app.email || "Unbekannt";
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          if (level === "critical") doc.setTextColor(220, 50, 50);
          else if (level === "urgent") doc.setTextColor(210, 130, 20);
          else doc.setTextColor(190, 160, 0);
          doc.text(`• ${name} — ${days} Tage (${SLA_LABEL[level]}) — ${app.jobs?.title || "—"}`, margin + 2, y);
          doc.setTextColor(0, 0, 0);
          y += 6;
        });
      }
    }

    // Jobs section
    if (jobs && jobs.length > 0) {
      y += 4;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, 190, y);
      y += 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Stellenanzeigen (${jobs.length})`, margin, y);
      y += 8;

      jobs.forEach((job) => {
        if (y > 265) { doc.addPage(); y = margin; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`• ${job.title}`, margin + 2, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const meta = [job.location || "Remote", job.employment_type || "—", job.is_active ? "Aktiv" : "Inaktiv"].join(" · ");
        doc.text(meta, margin + 6, y + 5);
        doc.setTextColor(0, 0, 0);
        y += 12;
      });
    }

    // Admin notes
    if (adminNotes.trim()) {
      y += 4;
      if (y > 240) { doc.addPage(); y = margin; }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, 190, y);
      y += 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Interne Admin-Notizen", margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(adminNotes, 160);
      doc.text(noteLines, margin, y);
    }

    doc.save(`Kanzlei-Dossier_${company.name.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF-Dossier wurde heruntergeladen");
  };

  if (!company) return null;

  const openJobs = jobs?.filter((job) => job.is_active) || [];
  const inactiveJobs = jobs?.filter((job) => !job.is_active) || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Kanzlei-Profil
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF} title="Kanzlei-Dossier exportieren (PDF)">
                  <FileDown className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} title="Kanzlei bearbeiten">
                  <Pencil className="h-4 w-4 mr-1" />
                  Bearbeiten
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Header with logo and status */}
            <div className="flex items-start gap-4">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-16 w-16 rounded-lg object-contain border bg-background"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">{company.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={company.is_active ? "default" : "destructive"}>
                    {company.is_active ? "Freigegeben" : "Gesperrt"}
                  </Badge>
                  {company.created_at && (
                    <span className="text-xs text-muted-foreground">
                      Seit {new Date(company.created_at).toLocaleDateString("de-DE")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Performance Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <MiniStat label="Aktive Stellen" value={String(openJobs.length)} icon={<Briefcase className="h-4 w-4" />} />
              <MiniStat label="Bewerbungen" value={String(applications?.length || 0)} icon={<Users className="h-4 w-4" />} />
              <MiniStat
                label="Überfällig"
                value={String(slaStats.warning + slaStats.urgent + slaStats.critical)}
                icon={<AlertTriangle className="h-4 w-4" />}
                variant={slaStats.critical > 0 ? "critical" : slaStats.urgent > 0 ? "urgent" : slaStats.warning > 0 ? "warning" : "default"}
              />
              <MiniStat
                label="Ø Reaktionszeit"
                value={slaStats.avgResponseTime !== null ? `${slaStats.avgResponseTime}d` : "—"}
                icon={<Clock className="h-4 w-4" />}
              />
              <MiniStat
                label="SLA-Quote"
                value={slaStats.compliance !== null ? `${slaStats.compliance}%` : "—"}
                icon={<ShieldCheck className="h-4 w-4" />}
                variant={slaStats.compliance !== null ? (slaStats.compliance >= 80 ? "default" : slaStats.compliance >= 50 ? "warning" : "critical") : "default"}
              />
            </div>

            <Separator />

            {/* Read-only company info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Stammdaten</h3>
              <div className="grid gap-3">
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Standort" value={company.location} />
                <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={company.website} isLink />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Inhaber" value={ownerEmail || "Kein Nutzer zugewiesen"} />
              </div>
              {company.description && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Beschreibung</p>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">{company.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Jobs overview */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Stellenanzeigen ({jobs?.length || 0})
              </h3>
              {openJobs.length === 0 && inactiveJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Stellenanzeigen vorhanden.</p>
              ) : (
                <div className="space-y-2">
                  {openJobs.map((job) => (<JobRow key={job.id} job={job} />))}
                  {inactiveJobs.map((job) => (<JobRow key={job.id} job={job} inactive />))}
                </div>
              )}
            </div>

            <Separator />

            {/* Applications with SLA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Bewerbungen ({applications?.length || 0})
                </h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="overdue-filter" className="text-xs text-muted-foreground cursor-pointer">
                    Nur überfällige
                  </Label>
                  <Switch id="overdue-filter" checked={showOverdueOnly} onCheckedChange={setShowOverdueOnly} />
                </div>
              </div>
              {filteredApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {showOverdueOnly ? "Keine überfälligen Bewerbungen." : "Keine Bewerbungen vorhanden."}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {filteredApplications.map((app) => (
                    <ApplicationSlaRow key={app.id} application={app} />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Admin Notes */}
            <div className="space-y-3 bg-muted/30 rounded-xl p-4 border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Interne Admin-Notiz
                </h3>
                <div className="flex items-center gap-2">
                  {notesMutation.isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  <Button variant="ghost" size="sm" onClick={handleSaveNotes} disabled={notesMutation.isPending} className="h-7 text-xs">
                    <StickyNote className="h-3 w-3 mr-1" />
                    Speichern
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">Nur für Admins sichtbar – niemals für die Kanzlei einsehbar.</p>
              <Textarea
                value={adminNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Interne Notizen zu dieser Kanzlei…"
                rows={4}
                className="text-sm"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CompanyEditModal company={company} open={editOpen} onOpenChange={setEditOpen} onDelete={onDelete} />
    </>
  );
};

// --- Helper components ---

const MiniStat = ({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "urgent" | "critical";
}) => {
  const variantClasses = {
    default: "bg-muted/30 text-foreground",
    warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    urgent: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    critical: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <div className={`rounded-lg border p-3 text-center ${variantClasses[variant]}`}>
      <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

const ApplicationSlaRow = ({ application }: { application: Application }) => {
  const sla = getSlaLevel(application);
  const days = getDaysSinceCreation(application.created_at);
  const name = [application.first_name, application.last_name].filter(Boolean).join(" ") || application.email || "Unbekannt";

  const rowClasses: Record<SlaLevel, string> = {
    ok: "bg-muted/20",
    warning: "bg-yellow-500/10 border border-yellow-500/20",
    urgent: "bg-orange-500/10 border border-orange-500/20",
    critical: "bg-destructive/10 border border-destructive/20",
  };

  const iconColors: Record<SlaLevel, string> = {
    ok: "",
    warning: "text-yellow-500",
    urgent: "text-orange-500",
    critical: "text-destructive",
  };

  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${rowClasses[sla]}`}>
      <div className="flex items-center gap-2 min-w-0">
        {sla !== "ok" && <AlertTriangle className={`h-4 w-4 shrink-0 ${iconColors[sla]}`} />}
        <div className="min-w-0">
          <p className="font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{application.jobs?.title || "—"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {sla === "critical" && (
          <Badge variant="destructive" className="text-xs whitespace-nowrap">Kritisch · {days}d</Badge>
        )}
        {sla === "urgent" && (
          <Badge className="text-xs bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30 whitespace-nowrap">Dringend · {days}d</Badge>
        )}
        {sla === "warning" && (
          <Badge className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 whitespace-nowrap">Reaktion nötig · {days}d</Badge>
        )}
        {sla === "ok" && (
          <span className="text-xs text-muted-foreground">{days}d</span>
        )}
        <Badge variant="secondary" className="text-xs">{application.status || "Neu"}</Badge>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, isLink }: { icon: React.ReactNode; label: string; value: string | null; isLink?: boolean }) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-muted-foreground w-20 shrink-0">{label}</span>
    {isLink && value ? (
      <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 truncate">
        {value}<ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    ) : (
      <span className="text-foreground truncate">{value || "—"}</span>
    )}
  </div>
);

const JobRow = ({ job, inactive }: { job: Job; inactive?: boolean }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${inactive ? "bg-muted/20 opacity-60" : "bg-muted/30"}`}>
    <div>
      <p className={`font-medium text-sm ${inactive ? "text-muted-foreground" : "text-foreground"}`}>{job.title}</p>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />{job.location || "Remote"}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">{job.employment_type || "—"}</Badge>
      {inactive && <Badge variant="outline" className="text-xs">Inaktiv</Badge>}
    </div>
  </div>
);

// Export SLA helpers for use in CompanyManagement
export { getSlaLevel, getHighestSlaLevel, SLA_LABEL, type Application, type SlaLevel };

export default CompanyDetailsModal;
