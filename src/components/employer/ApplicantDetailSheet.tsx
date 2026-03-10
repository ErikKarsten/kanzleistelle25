import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  Paperclip,
  Download,
  Save,
  Loader2,
  StickyNote,
  CheckCircle2,
  CalendarDays,
  DollarSign,
  Clock,
  Sparkles,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";

interface ApplicantDetailSheetProps {
  application: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
  companyName: string;
}

const statusOptions = [
  { value: "pending", label: "Neu", className: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "reviewing", label: "In Prüfung", className: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "interview", label: "Vorstellungsgespräch", className: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "accepted", label: "Angenommen", className: "bg-green-100 text-green-700 border-green-300" },
  { value: "rejected", label: "Abgelehnt", className: "bg-red-100 text-red-700 border-red-300" },
];

const ApplicantDetailSheet = ({
  application,
  open,
  onOpenChange,
  companyId,
  companyName,
}: ApplicantDetailSheetProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Sync notes when application changes
  useEffect(() => {
    if (application) {
      setNotes(application.internal_notes || "");
      setNotesSaved(true);
    }
  }, [application?.id, application?.internal_notes]);

  // Save notes mutation
  const saveNotesMutation = useMutation({
    mutationFn: async (notesText: string) => {
      if (!application) return;
      const { error } = await supabase
        .from("applications")
        .update({ internal_notes: notesText, updated_at: new Date().toISOString() })
        .eq("id", application.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setNotesSaved(true);
      queryClient.invalidateQueries({ queryKey: ["employer-applications", companyId] });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Notizen konnten nicht gespeichert werden", variant: "destructive" });
    },
  });

  // Auto-save with debounce
  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    setNotesSaved(false);
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    const timeout = setTimeout(() => {
      saveNotesMutation.mutate(value);
    }, 1500);
    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout, saveNotesMutation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    };
  }, [autoSaveTimeout]);

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!application) return;
      const { error } = await supabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", application.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-applications", companyId] });
      toast({ title: "Status aktualisiert!" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden", variant: "destructive" });
    },
  });

  const downloadBlob = async (path: string): Promise<Blob | null> => {
    const isLegacy = path.startsWith("applications/");
    const bucket = isLegacy ? "resumes" : "applications";
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) return null;
    return data;
  };

  const handleOpenDocument = async (path: string, label: string) => {
    const blob = await downloadBlob(path);
    if (!blob) {
      toast({ title: "Fehler", description: `${label} konnte nicht geladen werden. Bitte deaktiviere deinen Ad-Blocker, falls der Download nicht startet.`, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownloadDocument = async (path: string, label: string) => {
    const blob = await downloadBlob(path);
    if (!blob) {
      toast({ title: "Fehler", description: `${label} konnte nicht heruntergeladen werden. Bitte deaktiviere deinen Ad-Blocker, falls der Download nicht startet.`, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = path.split("/").pop()?.replace(/^(resume|certificates|cover_letter)_\d+_/, "") || "dokument.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenResume = () => {
    if (application?.resume_url) handleOpenDocument(application.resume_url, "Lebenslauf");
  };

  const handleExportPDF = async () => {
    if (!application) return;

    // Fetch message history for this application
    let chatMessages: any[] = [];
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("application_id", application.id)
        .order("created_at", { ascending: true });
      if (data) chatMessages = data;
    } catch {
      // Continue without messages
    }

    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Kandidaten-Profil", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Erstellt von: ${companyName}`, margin, y);
    y += 5;
    doc.text(`Datum: ${format(new Date(), "dd. MMMM yyyy", { locale: de })}`, margin, y);
    y += 12;

    // Separator line
    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 8;

    // Personal data
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Persönliche Daten", margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const addField = (label: string, value: string) => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 45, y);
      y += 6;
    };

    addField("Name", `${application.first_name || ""} ${application.last_name || ""}`.trim() || "—");
    addField("E-Mail", application.email || "—");
    addField("Telefon", application.phone || "—");
    addField("Rolle", application.applicant_role || "—");
    addField("Erfahrung", application.experience || "Keine Angabe");
    y += 4;

    // Additional profile details
    if (application.earliest_start_date || application.salary_expectation || application.notice_period || application.special_skills) {
      doc.setDrawColor(200);
      doc.line(margin, y, 190, y);
      y += 8;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Zusätzliche Angaben", margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (application.earliest_start_date) addField("Eintrittsdatum", format(new Date(application.earliest_start_date), "dd. MMMM yyyy", { locale: de }));
      if (application.salary_expectation) addField("Gehaltsvorstellung", application.salary_expectation);
      if (application.notice_period) addField("Kündigungsfrist", application.notice_period);
      if (application.special_skills) addField("Fachkenntnisse", application.special_skills);
      y += 4;
    }

    // Job info
    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 8;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Bewerbung für", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    addField("Stelle", application.jobs?.title || "—");
    addField("Status", statusOptions.find(s => s.value === application.status)?.label || application.status || "—");
    if (application.created_at) {
      addField("Beworben am", format(new Date(application.created_at), "dd. MMMM yyyy", { locale: de }));
    }

    // Documents section
    const docs = [
      { url: application.resume_url, label: "Lebenslauf" },
      { url: application.certificates_url, label: "Zeugnisse / Zertifikate" },
      { url: application.cover_letter_url, label: "Anschreiben (Datei)" },
    ].filter((d) => d.url);
    if (docs.length > 0) {
      y += 4;
      doc.setDrawColor(200);
      doc.line(margin, y, 190, y);
      y += 8;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Hochgeladene Unterlagen", margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      for (const d of docs) {
        if (y > 270) { doc.addPage(); y = margin; }
        const fileName = d.url!.split("/").pop()?.replace(/^(resume|certificates|cover_letter)_\d+_/, "") || "Dokument";
        addField(d.label, fileName);
      }
    }
    y += 4;

    // Cover letter
    if (application.cover_letter) {
      doc.setDrawColor(200);
      doc.line(margin, y, 190, y);
      y += 8;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Anschreiben", margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(application.cover_letter, 170);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 5;
      }
      y += 4;
    }

    // Internal notes
    if (notes) {
      doc.setDrawColor(200);
      doc.line(margin, y, 190, y);
      y += 8;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Interne Notizen", margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(notes, 170);
      for (const line of noteLines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 5;
      }
      y += 4;
    }

    // Message history
    if (chatMessages.length > 0) {
      doc.setDrawColor(200);
      doc.line(margin, y, 190, y);
      y += 8;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Nachrichtenverlauf", margin, y);
      y += 8;

      doc.setFontSize(9);
      for (const msg of chatMessages) {
        if (y > 260) { doc.addPage(); y = margin; }

        const timestamp = msg.created_at
          ? format(new Date(msg.created_at), "dd.MM.yyyy, HH:mm", { locale: de })
          : "—";
        const sender = msg.sender_type === "employer" ? "Kanzlei" : "Bewerber";

        // Date + sender line
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100);
        doc.text(`${timestamp}  |  ${sender}`, margin, y);
        y += 5;

        // Message content
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        const msgLines = doc.splitTextToSize(msg.content || "", 165);
        for (const line of msgLines) {
          if (y > 275) { doc.addPage(); y = margin; }
          doc.text(line, margin + 5, y);
          y += 4.5;
        }
        y += 3;
      }
    }

    const fileName = `Kandidat_${(application.first_name || "").replace(/\s/g, "_")}_${(application.last_name || "").replace(/\s/g, "_")}.pdf`;
    doc.save(fileName);
    toast({ title: "PDF exportiert", description: fileName });
  };

  if (!application) return null;

  const currentStatus = statusOptions.find(s => s.value === application.status) || statusOptions[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Bewerber-Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status section - prominent */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <Select
              value={application.status || "pending"}
              onValueChange={(val) => updateStatusMutation.mutate(val)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className={`text-sm px-3 py-1 ${currentStatus.className}`}>
            {currentStatus.label}
          </Badge>

          <Separator />

          {/* Personal Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Persönliche Daten
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium text-sm">{application.first_name} {application.last_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rolle</p>
                <p className="font-medium text-sm">{application.applicant_role || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Kontaktdaten
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-xs text-muted-foreground">E-Mail</p>
                <a href={`mailto:${application.email}`} className="font-medium text-sm text-primary hover:underline">
                  {application.email || "—"}
                </a>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                {application.phone ? (
                  <a href={`tel:${application.phone}`} className="font-medium text-sm text-primary hover:underline">
                    {application.phone}
                  </a>
                ) : (
                  <p className="font-medium text-sm">—</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Job Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Bewerbung für
            </h3>
            <div className="pl-6">
              <p className="font-medium text-sm">{application.jobs?.title || "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Beworben am:{" "}
                {application.created_at
                  ? format(new Date(application.created_at), "dd. MMMM yyyy, HH:mm 'Uhr'", { locale: de })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Experience */}
          {application.experience && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Berufserfahrung
                </h3>
                <p className="text-sm pl-6">{application.experience}</p>
              </div>
            </>
          )}

          {/* Cover Letter */}
          {application.cover_letter && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Anschreiben
                </h3>
                <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                  {application.cover_letter}
                </p>
              </div>
            </>
          )}

          {/* Additional Profile Details */}
          {(application.earliest_start_date || application.salary_expectation || application.notice_period || application.special_skills) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Zusätzliche Angaben
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  {application.earliest_start_date && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Eintrittsdatum</p>
                      <p className="font-medium text-sm">{format(new Date(application.earliest_start_date), "dd. MMM yyyy", { locale: de })}</p>
                    </div>
                  )}
                  {application.salary_expectation && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Gehaltsvorstellung</p>
                      <p className="font-medium text-sm">{application.salary_expectation}</p>
                    </div>
                  )}
                  {application.notice_period && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Kündigungsfrist</p>
                      <p className="font-medium text-sm">{application.notice_period}</p>
                    </div>
                  )}
                </div>
                {application.special_skills && (
                  <div className="pl-6">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Sparkles className="h-3 w-3" /> Fachkenntnisse</p>
                    <p className="text-sm">{application.special_skills}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Documents Section */}
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" />
              Unterlagen des Bewerbers
            </h3>
            <div className="space-y-2 pl-6">
              {[
                { url: application.resume_url, label: "Lebenslauf", icon: FileText },
                { url: application.certificates_url, label: "Zeugnisse / Zertifikate", icon: Paperclip },
                { url: application.cover_letter_url, label: "Anschreiben (Datei)", icon: FileText },
              ].map(({ url, label, icon: DocIcon }) => (
                <div key={label} className="flex items-center justify-between p-2.5 rounded-lg border bg-secondary/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <DocIcon className={`h-4 w-4 shrink-0 ${url ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      {url ? (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {url.split("/").pop()?.replace(/^(resume|certificates|cover_letter)_\d+_/, "") || "Dokument"}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nicht vorhanden</p>
                      )}
                    </div>
                  </div>
                  {url && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Ansehen" onClick={() => handleOpenDocument(url, label)}>
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Herunterladen" onClick={() => handleDownloadDocument(url, label)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Internal Notes - sticky note style */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <StickyNote className="h-4 w-4" style={{ color: "hsl(45, 90%, 40%)" }} />
                Interne Notizen
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {saveNotesMutation.isPending ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Speichert…
                  </span>
                ) : notesSaved ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> Gespeichert
                  </span>
                ) : (
                  <span>Ungespeicherte Änderungen</span>
                )}
              </div>
            </div>
            <div className="rounded-lg border p-1" style={{ backgroundColor: "hsl(48, 100%, 96%)", borderColor: "hsl(45, 60%, 80%)" }}>
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Notizen zu diesem Bewerber hinzufügen…"
                rows={4}
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-sm"
                style={{ color: "hsl(30, 10%, 25%)" }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveNotesMutation.mutate(notes)}
              disabled={notesSaved || saveNotesMutation.isPending}
            >
              <Save className="h-3 w-3 mr-1" />
              Notizen speichern
            </Button>
          </div>

          <Separator />

          {/* PDF Export */}
          <Button onClick={handleExportPDF} className="w-full" variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Kandidaten-Profil exportieren (PDF)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ApplicantDetailSheet;
