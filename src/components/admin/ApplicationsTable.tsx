import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import StatusSelect from "./StatusSelect";
import MatchApplicantDialog from "./MatchApplicantDialog";
import { handleDownload, buildSafeDocumentName } from "@/lib/documentAccess";
import { toast } from "sonner";

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
  user_id?: string | null;
  applicant_id?: string | null;
  jobs: {
    title: string;
    company: string;
    employment_type: string | null;
    location: string | null;
  } | null;
}

interface ApplicationsTableProps {
  applications: ApplicationWithJob[];
  onViewDetails: (application: ApplicationWithJob) => void;
}

const ApplicationsTable = ({ applications, onViewDetails }: ApplicationsTableProps) => {
  const [matchApp, setMatchApp] = useState<ApplicationWithJob | null>(null);

  const handleOpenResume = async (app: ApplicationWithJob) => {
    if (!app.resume_url) return;
    const fileName = buildSafeDocumentName({
      label: "Lebenslauf",
      firstName: app.first_name,
      lastName: app.last_name,
      rawPath: app.resume_url,
    });
    const success = await handleDownload(app.resume_url, fileName);
    if (!success) {
      toast.error("Lebenslauf konnte nicht geladen werden");
    }
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Keine Bewerbungen gefunden.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">E-Mail</TableHead>
              <TableHead className="font-semibold">Telefon</TableHead>
              <TableHead className="font-semibold">Rolle</TableHead>
              <TableHead className="font-semibold">Erfahrung</TableHead>
              <TableHead className="font-semibold">Beworben am</TableHead>
              <TableHead className="font-semibold">Job</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id} className="hover:bg-muted/30">
                <TableCell>
                  <button
                    onClick={() => onViewDetails(app)}
                    className="font-medium text-primary hover:underline text-left"
                  >
                    {app.first_name} {app.last_name}
                  </button>
                </TableCell>
                <TableCell>
                  <a
                    href={`mailto:${app.email}`}
                    className="text-muted-foreground hover:text-primary hover:underline"
                  >
                    {app.email}
                  </a>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {app.phone || "—"}
                </TableCell>
                <TableCell>{app.applicant_role || "—"}</TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {app.experience || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {app.created_at
                    ? format(new Date(app.created_at), "dd.MM.yyyy", { locale: de })
                    : "—"}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{app.jobs?.title || "Initiativ"}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.jobs?.company || "—"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusSelect
                    applicationId={app.id}
                    currentStatus={app.status || "pending"}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setMatchApp(app); }}
                      title="Anderer Kanzlei vorschlagen"
                      disabled={!app.user_id && !app.applicant_id}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    {app.resume_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenResume(app)}
                        title="Lebenslauf herunterladen"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {matchApp && (
        <MatchApplicantDialog
          open={!!matchApp}
          onOpenChange={(o) => { if (!o) setMatchApp(null); }}
          applicantUserId={matchApp.user_id || matchApp.applicant_id || null}
          applicantName={[matchApp.first_name, matchApp.last_name].filter(Boolean).join(" ") || "Unbekannt"}
        />
      )}
    </>
  );
};

export default ApplicationsTable;
