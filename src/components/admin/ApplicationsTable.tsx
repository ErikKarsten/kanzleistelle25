import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import StatusSelect from "./StatusSelect";
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
  const handleOpenResume = async (resumePath: string) => {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resumePath, 60);

    if (error) {
      toast.error("Lebenslauf konnte nicht geladen werden");
      return;
    }

    window.open(data.signedUrl, "_blank");
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
                  <p className="font-medium">{app.jobs?.title || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.jobs?.company}
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
                <div className="flex items-center justify-end gap-2">
                  {app.resume_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenResume(app.resume_url!)}
                      title="Lebenslauf öffnen"
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
  );
};

export default ApplicationsTable;
