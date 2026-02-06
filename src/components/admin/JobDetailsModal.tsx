import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  MapPin,
  Users,
  Save,
  Trash2,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
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

interface Job {
  id: string;
  title: string;
  company: string;
  company_id: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  requirements: string | null;
  salary_min: number | null;
  salary_max: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface Applicant {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  created_at: string | null;
}

interface JobDetailsModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

const employmentTypes = [
  { value: "vollzeit", label: "Vollzeit" },
  { value: "teilzeit", label: "Teilzeit" },
  { value: "freelance", label: "Freelance" },
  { value: "praktikum", label: "Praktikum" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Neu", className: "bg-yellow-100 text-yellow-800" },
  reviewed: { label: "Gesichtet", className: "bg-blue-100 text-blue-800" },
  contacted: { label: "Kontaktiert", className: "bg-purple-100 text-purple-800" },
  accepted: { label: "Angenommen", className: "bg-green-100 text-green-800" },
  rejected: { label: "Abgelehnt", className: "bg-red-100 text-red-800" },
};

const JobDetailsModal = ({
  job,
  open,
  onOpenChange,
  onDelete,
}: JobDetailsModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    employment_type: "vollzeit",
    description: "",
    requirements: "",
    salary_min: "",
    salary_max: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        location: job.location || "",
        employment_type: job.employment_type || "vollzeit",
        description: job.description || "",
        requirements: job.requirements || "",
        salary_min: job.salary_min?.toString() || "",
        salary_max: job.salary_max?.toString() || "",
      });
    }
  }, [job]);

  // Fetch applicants for this job
  const { data: applicants } = useQuery({
    queryKey: ["job-applicants", job?.id],
    queryFn: async () => {
      if (!job) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("id, first_name, last_name, email, phone, status, created_at")
        .eq("job_id", job.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Applicant[];
    },
    enabled: !!job,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!job) return;
      const { error } = await supabase
        .from("jobs")
        .update({
          title: data.title,
          location: data.location || null,
          employment_type: data.employment_type,
          description: data.description || null,
          requirements: data.requirements || null,
          salary_min: data.salary_min ? parseInt(data.salary_min) : null,
          salary_max: data.salary_max ? parseInt(data.salary_max) : null,
        })
        .eq("id", job.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      toast.success("Stelle aktualisiert");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Fehler beim Speichern");
    },
  });

  if (!job) return null;

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Titel ist erforderlich");
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Stelle bearbeiten
            </DialogTitle>
            <Badge
              className={
                job.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }
            >
              {job.is_active ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Edit Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="job-title">Titel *</Label>
              <Input
                id="job-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="z.B. Rechtsanwaltsfachangestellte/r"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-location">Standort</Label>
              <Input
                id="job-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="z.B. Berlin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-type">Anstellungsart</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, employment_type: value })
                }
              >
                <SelectTrigger id="job-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-min">Gehalt Min (€/Jahr)</Label>
              <Input
                id="salary-min"
                type="number"
                value={formData.salary_min}
                onChange={(e) =>
                  setFormData({ ...formData, salary_min: e.target.value })
                }
                placeholder="40000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-max">Gehalt Max (€/Jahr)</Label>
              <Input
                id="salary-max"
                type="number"
                value={formData.salary_max}
                onChange={(e) =>
                  setFormData({ ...formData, salary_max: e.target.value })
                }
                placeholder="60000"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="job-description">Beschreibung</Label>
              <Textarea
                id="job-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Beschreiben Sie die Stelle..."
                rows={3}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="job-requirements">Anforderungen</Label>
              <Textarea
                id="job-requirements"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                placeholder="Welche Qualifikationen werden erwartet?"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Applicants Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Bewerber für diese Stelle ({applicants?.length || 0})
            </h3>

            {!applicants || applicants.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-6">
                Noch keine Bewerbungen für diese Stelle.
              </p>
            ) : (
              <div className="space-y-2 pl-6">
                {applicants.map((applicant) => {
                  const status =
                    statusConfig[applicant.status || "pending"] ||
                    statusConfig.pending;
                  return (
                    <div
                      key={applicant.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {applicant.first_name} {applicant.last_name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {applicant.email}
                          </div>
                          {applicant.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {applicant.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {applicant.created_at
                              ? format(
                                  new Date(applicant.created_at),
                                  "dd.MM.yyyy",
                                  { locale: de }
                                )
                              : "—"}
                          </div>
                        </div>
                      </div>
                      <Badge className={status.className}>{status.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stelle löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Die Stelle
                    wird unwiderruflich gelöscht. Bestehende Bewerbungen bleiben
                    erhalten, verlieren aber die Verknüpfung.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(job.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Endgültig löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;
