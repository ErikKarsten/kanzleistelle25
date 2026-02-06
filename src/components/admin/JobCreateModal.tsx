import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Plus } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
}

interface JobCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCompany?: Company | null;
}

const employmentTypes = [
  { value: "vollzeit", label: "Vollzeit" },
  { value: "teilzeit", label: "Teilzeit" },
  { value: "freelance", label: "Freelance" },
  { value: "praktikum", label: "Praktikum" },
];

const JobCreateModal = ({
  open,
  onOpenChange,
  preselectedCompany,
}: JobCreateModalProps) => {
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

  // Reset form when modal opens with preselected company
  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        location: "",
        employment_type: "vollzeit",
        description: "",
        requirements: "",
        salary_min: "",
        salary_max: "",
      });
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!preselectedCompany) throw new Error("Keine Kanzlei ausgewählt");

      const { error } = await supabase.from("jobs").insert({
        title: data.title,
        company: preselectedCompany.name,
        company_id: preselectedCompany.id,
        location: data.location || null,
        employment_type: data.employment_type,
        description: data.description || null,
        requirements: data.requirements || null,
        salary_min: data.salary_min ? parseInt(data.salary_min) : null,
        salary_max: data.salary_max ? parseInt(data.salary_max) : null,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-jobs"] });
      toast.success("Stelle erstellt", {
        description: `Die Stelle wurde für "${preselectedCompany?.name}" angelegt.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Job creation error:", error);
      toast.error("Fehler beim Erstellen", {
        description: "Bitte prüfen Sie Ihre Berechtigung.",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.title.trim()) {
      toast.error("Titel ist erforderlich");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Neue Stelle erstellen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Company Info (read-only) */}
          {preselectedCompany && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Kanzlei</p>
              <p className="font-medium">{preselectedCompany.name}</p>
            </div>
          )}

          <div className="space-y-2">
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="flex justify-end pt-4">
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Stelle erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobCreateModal;
