import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Briefcase, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { jobSchema } from "@/lib/validations";

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
  { value: "minijob", label: "Minijob" },
];

const NO_COMPANY = "__none__";

const JobCreateModal = ({
  open,
  onOpenChange,
  preselectedCompany,
}: JobCreateModalProps) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(NO_COMPANY);
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

  // Fetch all companies for dropdown
  const { data: companies } = useQuery({
    queryKey: ["admin-companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Company[];
    },
    enabled: open,
  });

  // Reset form when modal opens
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
      setSelectedCompanyId(preselectedCompany?.id || NO_COMPANY);
    }
  }, [open, preselectedCompany]);

  const selectedCompany = companies?.find((c) => c.id === selectedCompanyId);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const companyName = selectedCompany?.name || "Allgemein";
      const validated = jobSchema.parse({ ...data, company: companyName });

      const { error } = await supabase.from("jobs").insert({
        title: validated.title,
        company: companyName,
        company_id: selectedCompanyId !== NO_COMPANY ? selectedCompanyId : null,
        location: validated.location || null,
        employment_type: validated.employment_type || null,
        description: validated.description || null,
        requirements: validated.requirements || null,
        salary_min: validated.salary_min ? parseInt(validated.salary_min) : null,
        salary_max: validated.salary_max ? parseInt(validated.salary_max) : null,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      toast.success("Stelle erstellt", {
        description: `Die Stelle wurde erfolgreich angelegt.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      const msg = error?.issues
        ? error.issues.map((i: any) => i.message).join(", ")
        : "Bitte prüfen Sie Ihre Eingaben.";
      toast.error("Fehler beim Erstellen", { description: msg });
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
          {/* Company Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="job-company">Kanzlei</Label>
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger id="job-company">
                <SelectValue placeholder="Kanzlei auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_COMPANY}>Keine / Allgemeine Stelle</SelectItem>
                {companies?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              rows={4}
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
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Stelle erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobCreateModal;
