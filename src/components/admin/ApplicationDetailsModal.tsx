import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  Download,
  Archive,
  Trash2,
  UserPlus,
  CheckCircle2
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
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { handleDownload, buildSafeDocumentName } from "@/lib/documentAccess";
import MatchApplicantDialog from "./MatchApplicantDialog";

interface ApplicationWithJob {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  applicant_role: string | null;
  experience: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  status: string | null;
  created_at: string | null;
  is_archived?: boolean;
  user_id?: string | null;
  applicant_id?: string | null;
  jobs: {
    title: string;
    company: string;
    employment_type: string | null;
    location: string | null;
  } | null;
}

interface ApplicationDetailsModalProps {
  application: ApplicationWithJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  isArchived?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Neu", className: "bg-yellow-100 text-yellow-800" },
  reviewed: { label: "Gesichtet", className: "bg-blue-100 text-blue-800" },
  contacted: { label: "Kontaktiert", className: "bg-purple-100 text-purple-800" },
  accepted: { label: "Angenommen", className: "bg-green-100 text-green-800" },
  rejected: { label: "Abgelehnt", className: "bg-red-100 text-red-800" },
};

const ApplicationDetailsModal = ({
  application,
  open,
  onOpenChange,
  onArchive,
  onDelete,
  isArchived = false,
}: ApplicationDetailsModalProps) => {
  const [matchOpen, setMatchOpen] = useState(false);
  const [cvLoading, setCvLoading] = useState(false);
  const [showCvConfirm, setShowCvConfirm] = useState(false);
  const [generatedCvHtml, setGeneratedCvHtml] = useState<string | null>(null);
  const [generatedCvUrl, setGeneratedCvUrl] = useState<string | null>(
    application?.resume_url || null
  );

  useEffect(() => {
    if (application?.resume_url) {
      setGeneratedCvUrl(application.resume_url);
    } else {
      setGeneratedCvUrl(null);
    }
  }, [application]);

  function openCvWindow(html: string) {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html><html><head>
        <title>Lebenslauf - ${application?.first_name} ${application?.last_name}</title>
        <style>@media print { .no-print { display: none; } }</style>
        </head><body>
        <div class="no-print" style="padding:16px;background:#f0f0f0;display:flex;gap:12px;margin-bottom:24px;">
          <button onclick="window.print()"
            style="background:#1a2744;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:14px;">
            📄 Als PDF speichern
          </button>
          <button onclick="window.close()"
            style="background:white;color:#333;border:1px solid #ccc;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:14px;">
            ✕ Schließen
          </button>
        </div>
        ${html}
        </body></html>
      `);
      win.document.close();
    }
  }

  async function handleGenerateCV() {
    setCvLoading(true);
    try {
      const res = await fetch(
        "https://myvjwpbhdnnrkwazudnh.supabase.co/functions/v1/generate-cv",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ candidate: application })
        }
      );
      const data = await res.json();
      if (data.html) {
        // Platzhalter lokal ersetzen (keine API-Übertragung!)
        const filledHtml = data.html
          .replace(/\[Name des Kandidaten\]/g,
            `${application.first_name} ${application.last_name}`)
          .replace(/\[E-Mail-Adresse\]/g, application.email || '')
          .replace(/\[Telefonnummer\]/g, application.phone || '');

        setGeneratedCvHtml(filledHtml);
        setGeneratedCvUrl('generated');
        openCvWindow(filledHtml);
      }
    } catch (e) {
      alert("Fehler beim Generieren");
      console.error(e);
    }
    setCvLoading(false);
  }

  async function openAnonymizedCv() {
    let html = generatedCvHtml;

    if (!html) {
      setCvLoading(true);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666"><div style="text-align:center"><div style="font-size:48px">⏳</div><p>Wird generiert...</p></div></body></html>');
      }
      try {
        const res = await fetch(
          "https://myvjwpbhdnnrkwazudnh.supabase.co/functions/v1/generate-cv",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ candidate: application })
          }
        );
        const data = await res.json();
        if (data.html) {
          html = data.html
            .replace(/\[Name des Kandidaten\]/g, `${application?.first_name} ${application?.last_name}`)
            .replace(/\[E-Mail-Adresse\]/g, application?.email || '')
            .replace(/\[Telefonnummer\]/g, application?.phone || '');
          setGeneratedCvHtml(html);
          setGeneratedCvUrl('generated');
        }
        if (win) win.close();
      } catch (e) {
        if (win) win.close();
        alert("Fehler beim Generieren");
        setCvLoading(false);
        return;
      }
      setCvLoading(false);
    }

    if (!html) return;

    const anonymized = html
      .replace(new RegExp(`${application?.first_name}\\s*${application?.last_name}`, 'gi'), 'Kandidat/in')
      .replace(new RegExp(application?.email?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || 'NOEMAIL', 'g'), '●●●●@●●●●.de')
      .replace(new RegExp(application?.phone?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || 'NOPHONE', 'g'), '+49 ●●●● ●●●●●●');

    openCvWindow(anonymized);
  }

  if (!application) return null;

  const handleDownloadResume = async () => {
    if (!application.resume_url) return;
    const fileName = buildSafeDocumentName({
      label: "Lebenslauf",
      firstName: application.first_name,
      lastName: application.last_name,
      rawPath: application.resume_url,
    });
    const success = await handleDownload(application.resume_url, fileName);
    if (!success) {
      toast.error("Dokument konnte nicht vom Server abgerufen werden.");
    }
  };

  const status = statusConfig[application.status || "pending"] || statusConfig.pending;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              Bewerbungsdetails
            </DialogTitle>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Persönliche Daten
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">
                  {application.first_name} {application.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rolle</p>
                <p className="font-medium">{application.applicant_role || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Kontaktdaten
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-sm text-muted-foreground">E-Mail</p>
                <a
                  href={`mailto:${application.email}`}
                  className="font-medium text-primary hover:underline"
                >
                  {application.email}
                </a>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{application.phone || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Job Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Bewerbung für
            </h3>
            <div className="pl-6 space-y-2">
              <p className="font-medium">{application.jobs?.title || "—"}</p>
              <p className="text-sm text-muted-foreground">
                {application.jobs?.company} • {application.jobs?.location || "Remote"} • {application.jobs?.employment_type || "—"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Experience */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Berufserfahrung
            </h3>
            <div className="pl-6">
              <p className="font-medium">{application.experience || "Keine Angabe"}</p>
            </div>
          </div>

          {/* Cover Letter */}
          {application.cover_letter && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Anschreiben
                </h3>
                <div className="pl-6">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {application.cover_letter}
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Beworben am:{" "}
              {application.created_at
                ? format(new Date(application.created_at), "dd. MMMM yyyy, HH:mm 'Uhr'", {
                    locale: de,
                  })
                : "—"}
            </span>
          </div>

          <Separator />

          {generatedCvUrl && (
            <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Lebenslauf wurde generiert</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (generatedCvHtml) {
                      openCvWindow(generatedCvHtml);
                    } else {
                      handleGenerateCV();
                    }
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  📄 Öffnen
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={async () => {
                    if (!confirm("Lebenslauf wirklich löschen?")) return;
                    await supabase
                      .from("applications")
                      .update({ resume_url: null })
                      .eq("id", application.id);
                    setGeneratedCvUrl(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline"
                >
                  🗑 Löschen
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons — Zeile 1 */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              onClick={() => setShowCvConfirm(true)}
              disabled={cvLoading}
              size="sm"
            >
              {cvLoading ? "Wird generiert..." : "📄 Lebenslauf generieren"}
            </Button>
            {generatedCvHtml && (
              <Button
                variant="outline"
                size="sm"
                onClick={openAnonymizedCv}
              >
                👁 Anonymisiert für Kanzlei
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Funktion bald verfügbar"
              className="opacity-50 cursor-not-allowed"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Kanzlei vorschlagen
            </Button>
            {onArchive && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onArchive(application.id)}
              >
                <Archive className="h-4 w-4 mr-1" />
                {isArchived ? "Wiederherstellen" : "Archivieren"}
              </Button>
            )}
          </div>

          {/* Action Buttons — Zeile 2 */}
          {onDelete && (
            <div className="mt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bewerbung löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden. Die
                      Bewerbung wird unwiderruflich aus der Datenbank gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(application.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Endgültig löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>

    <MatchApplicantDialog
      open={matchOpen}
      onOpenChange={setMatchOpen}
      applicantUserId={application.user_id || application.applicant_id || null}
      applicantName={[application.first_name, application.last_name].filter(Boolean).join(" ") || "Unbekannt"}
      applicantEmail={application.email || null}
    />

    <AlertDialog open={showCvConfirm} onOpenChange={setShowCvConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Datenschutz-Hinweis</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              Zum Generieren des Lebenslaufs werden folgende Daten an die
              Anthropic KI-API übermittelt:
              <ul style={{ marginTop: "8px", paddingLeft: "16px" }}>
                <li>Name des Kandidaten</li>
                <li>E-Mail-Adresse</li>
                <li>Telefonnummer</li>
                <li>Position und Erfahrung</li>
                <li>Standort</li>
              </ul>
              <br />
              Anthropic verarbeitet diese Daten gemäß ihrer
              Datenschutzrichtlinie. Bitte stellen Sie sicher, dass
              der Kandidat dieser Verarbeitung zugestimmt hat.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            setShowCvConfirm(false);
            handleGenerateCV();
          }}>
            Verstanden, Lebenslauf generieren
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ApplicationDetailsModal;
