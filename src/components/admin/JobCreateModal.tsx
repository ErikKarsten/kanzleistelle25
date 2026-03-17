import { useState, useEffect, useMemo } from "react";
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
import { Briefcase, Plus, Loader2, X } from "lucide-react";
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

const REQUIREMENT_SUGGESTIONS = [
  "DATEV-Kenntnisse",
  "Teamfähigkeit",
  "Eigenständige Arbeitsweise",
  "Berufserfahrung",
  "Abgeschlossene Ausbildung",
] as const;

const BENEFIT_SUGGESTIONS = [
  "Homeoffice möglich",
  "30 Tage Urlaub",
  "Fortbildungen",
  "Kostenlose Getränke",
  "Modernes Büro",
  "Fahrtkostenzuschuss",
] as const;

const employmentTypes = [
  { value: "vollzeit", label: "Vollzeit" },
  { value: "teilzeit", label: "Teilzeit" },
  { value: "minijob", label: "Minijob" },
] as const;

const workingModels = [
  { value: "vor_ort", label: "Vor Ort" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
] as const;

const initialFormData = {
  title: "",
  location: "",
  employment_type: "vollzeit",
  working_model: "vor_ort",
  description: "",
  salary_range: "",
};

const JobCreateModal = ({
  open,
  onOpenChange,
  preselectedCompany,
}: JobCreateModalProps) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [formData, setFormData] = useState(initialFormData);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [requirementInput, setRequirementInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (!open) return;

    setFormData(initialFormData);
    setRequirements([]);
    setBenefits([]);
    setRequirementInput("");
    setBenefitInput("");
    setSelectedCompanyId(preselectedCompany?.id ?? "");
  }, [open, preselectedCompany]);

  const selectedCompany = useMemo(
    () => companies?.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  const toggleTag = (
    value: string,
    list: string[],
    setList: (values: string[]) => void
  ) => {
    if (list.includes(value)) {
      setList(list.filter((entry) => entry !== value));
      return;
    }

    setList([...list, value]);
  };

  const addCustomTag = (
    input: string,
    setInput: (value: string) => void,
    list: string[],
    setList: (values: string[]) => void
  ) => {
    const value = input.trim();
    if (value && !list.includes(value)) {
      setList([...list, value]);
    }
    setInput("");
  };

  const removeTag = (
    value: string,
    list: string[],
    setList: (values: string[]) => void
  ) => {
    setList(list.filter((entry) => entry !== value));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompanyId || !selectedCompany) {
        throw new Error("Bitte wählen Sie eine Kanzlei aus.");
      }

      const { employerJobSchema } = await import("@/lib/validations");
      employerJobSchema.parse(formData);

      const { error } = await supabase.from("jobs").insert({
        title: formData.title.trim(),
        company: selectedCompany.name,
        company_id: selectedCompanyId,
        location: formData.location.trim() || null,
        employment_type: formData.employment_type || null,
        working_model: formData.working_model || null,
        description: formData.description.trim() || null,
        requirements: requirements.length > 0 ? requirements.join("\n") : null,
        benefits: benefits.length > 0 ? benefits : [],
        salary_range: formData.salary_range.trim() || null,
        is_active: true,
        status: "published",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      toast.success("Stelle veröffentlicht", {
        description: "Die Stelle wurde direkt als veröffentlicht gespeichert.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.issues
        ? error.issues.map((issue: any) => issue.message).join(", ")
        : error?.message || "Bitte prüfen Sie Ihre Eingaben.";

      toast.error("Fehler beim Erstellen", { description: message });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCompanyId) {
      toast.error("Kanzlei ist erforderlich");
      return;
    }

    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Neue Stelle erstellen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="job-company">Kanzlei auswählen *</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger id="job-company">
                <SelectValue placeholder="Kanzlei auswählen" />
              </SelectTrigger>
              <SelectContent>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-title">Jobtitel *</Label>
            <Input
              id="job-title"
              value={formData.title}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="z.B. Steuerfachangestellte/r"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job-location">Standort</Label>
              <Input
                id="job-location"
                value={formData.location}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, location: event.target.value }))
                }
                placeholder="z.B. München"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-type">Anstellungsart</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, employment_type: value }))
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="working-model">Arbeitsmodell</Label>
              <Select
                value={formData.working_model}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, working_model: value }))
                }
              >
                <SelectTrigger id="working-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workingModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-range">Gehaltsrahmen (optional)</Label>
              <Input
                id="salary-range"
                value={formData.salary_range}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, salary_range: event.target.value }))
                }
                placeholder="z.B. 45.000 - 55.000 €"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-description">Stellenbeschreibung</Label>
            <Textarea
              id="job-description"
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Beschreiben Sie die Position..."
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Anforderungen</Label>
            <div className="flex gap-2">
              <Input
                value={requirementInput}
                onChange={(event) => setRequirementInput(event.target.value)}
                placeholder="Eigene Anforderung eingeben..."
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomTag(
                      requirementInput,
                      setRequirementInput,
                      requirements,
                      setRequirements
                    );
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  addCustomTag(
                    requirementInput,
                    setRequirementInput,
                    requirements,
                    setRequirements
                  )
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Hinzufügen
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {REQUIREMENT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() =>
                    toggleTag(suggestion, requirements, setRequirements)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    requirements.includes(suggestion)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {requirements.map((requirement) => (
                  <span
                    key={requirement}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground"
                  >
                    {requirement}
                    <button
                      type="button"
                      onClick={() =>
                        removeTag(requirement, requirements, setRequirements)
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Benefits</Label>
            <div className="flex gap-2">
              <Input
                value={benefitInput}
                onChange={(event) => setBenefitInput(event.target.value)}
                placeholder="Eigenen Benefit eingeben..."
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomTag(benefitInput, setBenefitInput, benefits, setBenefits);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  addCustomTag(benefitInput, setBenefitInput, benefits, setBenefits)
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Hinzufügen
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {BENEFIT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => toggleTag(suggestion, benefits, setBenefits)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    benefits.includes(suggestion)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {benefits.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground"
                  >
                    {benefit}
                    <button
                      type="button"
                      onClick={() => removeTag(benefit, benefits, setBenefits)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createMutation.isPending} size="lg">
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Stelle veröffentlichen
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobCreateModal;
