import { useState, useEffect, useCallback, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Load admin notes and owner email when company changes
  useEffect(() => {
    if (company) {
      // Fetch admin_notes
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

  // Save admin notes mutation
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

  // Debounced auto-save for admin notes
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

  // Cleanup timer
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

    // Title
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

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 10;

    // Company info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Stammdaten", margin, y);
    y += 8;

    const addField = (label: string, value: string) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
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
        if (y > 265) {
          doc.addPage();
          y = margin;
        }
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
      if (y > 240) {
        doc.addPage();
        y = margin;
      }
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  title="Kanzlei-Dossier exportieren (PDF)"
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  title="Kanzlei bearbeiten"
                >
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
                />
              ) : (
                <div className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {company.name}
                </h2>
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

            {/* Read-only company info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Stammdaten
              </h3>
              <div className="grid gap-3">
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Standort"
                  value={company.location}
                />
                <InfoRow
                  icon={<Globe className="h-4 w-4" />}
                  label="Website"
                  value={company.website}
                  isLink
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Inhaber"
                  value={ownerEmail || "Kein Nutzer zugewiesen"}
                />
              </div>
              {company.description && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Beschreibung</p>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
                    {company.description}
                  </p>
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
                <p className="text-sm text-muted-foreground">
                  Keine Stellenanzeigen vorhanden.
                </p>
              ) : (
                <div className="space-y-2">
                  {openJobs.map((job) => (
                    <JobRow key={job.id} job={job} />
                  ))}
                  {inactiveJobs.map((job) => (
                    <JobRow key={job.id} job={job} inactive />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Admin Notes - exclusive section */}
            <div className="space-y-3 bg-muted/30 rounded-xl p-4 border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Interne Admin-Notiz
                </h3>
                <div className="flex items-center gap-2">
                  {notesMutation.isPending && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={notesMutation.isPending}
                    className="h-7 text-xs"
                  >
                    <StickyNote className="h-3 w-3 mr-1" />
                    Speichern
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Nur für Admins sichtbar – niemals für die Kanzlei einsehbar.
              </p>
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

      {/* Edit Modal */}
      <CompanyEditModal
        company={company}
        open={editOpen}
        onOpenChange={setEditOpen}
        onDelete={onDelete}
      />
    </>
  );
};

// Helper components
const InfoRow = ({
  icon,
  label,
  value,
  isLink,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  isLink?: boolean;
}) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-muted-foreground w-20 shrink-0">{label}</span>
    {isLink && value ? (
      <a
        href={value.startsWith("http") ? value : `https://${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline flex items-center gap-1 truncate"
      >
        {value}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    ) : (
      <span className="text-foreground truncate">{value || "—"}</span>
    )}
  </div>
);

const JobRow = ({ job, inactive }: { job: { id: string; title: string; employment_type: string | null; location: string | null; is_active: boolean | null }; inactive?: boolean }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${inactive ? "bg-muted/20 opacity-60" : "bg-muted/30"}`}>
    <div>
      <p className={`font-medium text-sm ${inactive ? "text-muted-foreground" : "text-foreground"}`}>{job.title}</p>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {job.location || "Remote"}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">{job.employment_type || "—"}</Badge>
      {inactive && <Badge variant="outline" className="text-xs">Inaktiv</Badge>}
    </div>
  </div>
);

export default CompanyDetailsModal;
