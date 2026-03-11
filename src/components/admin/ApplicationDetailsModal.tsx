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
  Trash2
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Resume Button */}
          {application.resume_url && (
            <Button
              onClick={handleDownloadResume}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Lebenslauf herunterladen
            </Button>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
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

            {onDelete && (
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailsModal;
