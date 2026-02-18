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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Briefcase,
  MapPin,
  Users,
  Save,
  Trash2,
  Calendar,
  Mail,
  Phone,
  Eye,
  Pencil,
  EuroIcon,
  Monitor,
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
  working_model?: string | null;
  description: string | null;
  requirements: string | null;
  benefits?: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_range?: string | null;
  is_active: boolean | null;
  status?: string | null;
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
  { value: "minijob", label: "Minijob" },
  { value: "freelance", label: "Freelance" },
  { value: "praktikum", label: "Praktikum" },
];

const workingModels = [
  { value: "vor_ort", label: "Vor Ort" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const workingModelLabels: Record<string, string> = {
  vor_ort: "Vor Ort",
  hybrid: "Hybrid",
  remote: "Remote",
};

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
  const [activeTab, setActiveTab] = useState("preview");
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    employment_type: "vollzeit",
    working_model: "vor_ort",
    description: "",
    requirements: "",
    salary_range: "",
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
        working_model: job.working_model || "vor_ort",
        description: job.description || "",
        requirements: job.requirements || "",
        salary_range: job.salary_range || "",
        salary_min: job.salary_min?.toString() || "",
        salary_max: job.salary_max?.toString() || "",
      });
      setActiveTab("preview");
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
    enabled: !!job && open,
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
          working_model: data.working_model || null,
          description: data.description || null,
          requirements: data.requirements || null,
          salary_range: data.salary_range || null,
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
    onError: (err: any) => {
      toast.error("Fehler beim Speichern: " + (err?.message || "Unbekannter Fehler"));
    },
  });

  if (!job) return null;

  const requirementsList = job.requirements
    ? job.requirements.split("\n").filter(Boolean)
    : [];
  const benefitsList = Array.isArray(job.benefits) ? job.benefits : [];

  const salaryDisplay =
    job.salary_range ||
    (job.salary_min && job.salary_max
      ? `${job.salary_min.toLocaleString("de-DE")} – ${job.salary_max.toLocaleString("de-DE")} €`
      : null);

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
              {job.title}
            </DialogTitle>
            <Badge
              className={
                job.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }
            >
              {job.is_active ? "🟢 Live" : "⭕ Inaktiv"}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              Vorschau
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Bearbeiten
            </TabsTrigger>
            <TabsTrigger value="applicants" className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Bewerber ({applicants?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-4 pt-2">
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              {/* Meta info */}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary/70" />
                    {job.location}
                  </span>
                )}
                {job.employment_type && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {employmentTypes.find(t => t.value === job.employment_type)?.label || job.employment_type}
                  </Badge>
                )}
                {job.working_model && (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    <Monitor className="h-3 w-3 mr-1" />
                    {workingModelLabels[job.working_model] || job.working_model}
                  </Badge>
                )}
                {salaryDisplay && (
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <EuroIcon className="h-4 w-4 text-primary/70" />
                    {salaryDisplay}
                  </span>
                )}
              </div>

              {/* Description */}
              {job.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{job.description}</p>
              )}

              {/* Requirements & Benefits */}
              {(requirementsList.length > 0 || benefitsList.length > 0) && (
                <>
                  <Separator />
                  <div className="grid sm:grid-cols-2 gap-6">
                    {requirementsList.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Anforderungen
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {requirementsList.map((r) => (
                            <span key={r} className="px-3 py-1 rounded-full text-xs bg-secondary text-secondary-foreground border border-border">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {benefitsList.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Benefits
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {benefitsList.map((b) => (
                            <span key={b} className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {requirementsList.length === 0 && benefitsList.length === 0 && !job.description && (
                <p className="text-sm text-muted-foreground italic">Keine Details vorhanden.</p>
              )}
            </div>

            <div className="flex justify-between pt-2">
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
                      Diese Aktion kann nicht rückgängig gemacht werden.
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
              <Button variant="outline" onClick={() => setActiveTab("edit")}>
                <Pencil className="h-4 w-4 mr-1" />
                Bearbeiten
              </Button>
            </div>
          </TabsContent>

          {/* EDIT TAB */}
          <TabsContent value="edit" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="job-title">Titel *</Label>
                <Input
                  id="job-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-location">Standort</Label>
                <Input
                  id="job-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-type">Anstellungsart</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(v) => setFormData({ ...formData, employment_type: v })}
                >
                  <SelectTrigger id="job-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="working-model">Arbeitsmodell</Label>
                <Select
                  value={formData.working_model}
                  onValueChange={(v) => setFormData({ ...formData, working_model: v })}
                >
                  <SelectTrigger id="working-model"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {workingModels.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-range">Gehaltsrahmen</Label>
                <Input
                  id="salary-range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  placeholder="z.B. 45.000 - 55.000 €"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="job-description">Beschreibung</Label>
                <Textarea
                  id="job-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="job-requirements">Anforderungen (eine pro Zeile)</Label>
                <Textarea
                  id="job-requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                  placeholder="DATEV-Kenntnisse&#10;Teamfähigkeit&#10;..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
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
                      Diese Aktion kann nicht rückgängig gemacht werden.
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
          </TabsContent>

          {/* APPLICANTS TAB */}
          <TabsContent value="applicants" className="pt-2">
            <div className="space-y-3">
              {!applicants || applicants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Noch keine Bewerbungen für diese Stelle.
                </p>
              ) : (
                applicants.map((applicant) => {
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
                              ? format(new Date(applicant.created_at), "dd.MM.yyyy", { locale: de })
                              : "—"}
                          </div>
                        </div>
                      </div>
                      <Badge className={status.className}>{status.label}</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;

