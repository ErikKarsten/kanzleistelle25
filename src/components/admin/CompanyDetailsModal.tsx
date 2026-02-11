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
import { Building2, MapPin, Briefcase, Trash2, Save, Plus } from "lucide-react";
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
import JobCreateModal from "./JobCreateModal";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  location: string | null;
  created_at: string | null;
  is_active: boolean;
  website: string | null;
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
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    logo_url: "",
    website: "",
  });
  const [jobCreateOpen, setJobCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        location: company.location || "",
        description: company.description || "",
        logo_url: company.logo_url || "",
        website: company.website || "",
      });
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

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!company) return;
      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          location: data.location || null,
          description: data.description || null,
          logo_url: data.logo_url || null,
          website: data.website || null,
        } as any)
        .eq("id", company.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Kanzlei aktualisiert");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Fehler beim Speichern");
    },
  });

  if (!company) return null;

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }
    updateMutation.mutate(formData);
  };

  const openJobs = jobs?.filter((job) => job.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Kanzlei bearbeiten
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Edit Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Kanzleiname"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Standort</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="z.B. Berlin, Hamburg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://www.kanzlei-beispiel.de"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Kurze Beschreibung der Kanzlei..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Jobs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Offene Stellen dieser Kanzlei ({openJobs.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJobCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Neue Stelle schalten
              </Button>
            </div>

            {openJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-6">
                Keine offenen Stellen für diese Kanzlei.
              </p>
            ) : (
              <div className="space-y-2 pl-6">
                {openJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.location || "Remote"}
                      </div>
                    </div>
                    <Badge variant="secondary">{job.employment_type || "—"}</Badge>
                  </div>
                ))}
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
                  <AlertDialogTitle>Kanzlei löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Die Kanzlei
                    und alle zugehörigen Daten werden unwiderruflich gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(company.id)}
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

        {/* Job Create Modal */}
        <JobCreateModal
          open={jobCreateOpen}
          onOpenChange={setJobCreateOpen}
          preselectedCompany={company ? { id: company.id, name: company.name } : null}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CompanyDetailsModal;
