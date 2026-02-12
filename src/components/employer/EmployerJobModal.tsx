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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { jobSchema } from "@/lib/validations";

interface EmployerJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any | null;
  companyId: string | null;
  companyName: string;
}

const EmployerJobModal = ({
  open,
  onOpenChange,
  job,
  companyId,
  companyName,
}: EmployerJobModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    employment_type: "vollzeit",
    description: "",
    requirements: "",
    salary_min: "",
    salary_max: "",
  });

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
    } else {
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
  }, [job, open]);

  const createJobMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId) throw new Error("Kanzlei-Profil nicht gefunden. Bitte Profil vervollständigen.");
      
      const validated = jobSchema.parse(data);

      const { error } = await supabase.from("jobs").insert({
        title: validated.title,
        company: companyName,
        company_id: companyId,
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
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      toast({ title: "Stelle erstellt!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!job) throw new Error("Keine Stelle ausgewählt");
      const validated = jobSchema.parse(data);

      const { error } = await supabase
        .from("jobs")
        .update({
          title: validated.title,
          location: validated.location || null,
          employment_type: validated.employment_type || null,
          description: validated.description || null,
          requirements: validated.requirements || null,
          salary_min: validated.salary_min ? parseInt(validated.salary_min) : null,
          salary_max: validated.salary_max ? parseInt(validated.salary_max) : null,
        })
        .eq("id", job.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      toast({ title: "Stelle aktualisiert!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (job) {
      updateJobMutation.mutate(formData);
    } else {
      createJobMutation.mutate(formData);
    }
  };

  const isLoading = createJobMutation.isPending || updateJobMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {job ? "Stelle bearbeiten" : "Neue Stelle erstellen"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Jobtitel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              placeholder="z.B. Steuerfachangestellte/r"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Standort</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="z.B. München"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment_type">Anstellungsart</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, employment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vollzeit">Vollzeit</SelectItem>
                  <SelectItem value="teilzeit">Teilzeit</SelectItem>
                  <SelectItem value="minijob">Minijob</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Gehalt von (€/Jahr)</Label>
              <Input
                id="salary_min"
                type="number"
                value={formData.salary_min}
                onChange={(e) =>
                  setFormData({ ...formData, salary_min: e.target.value })
                }
                placeholder="z.B. 40000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Gehalt bis (€/Jahr)</Label>
              <Input
                id="salary_max"
                type="number"
                value={formData.salary_max}
                onChange={(e) =>
                  setFormData({ ...formData, salary_max: e.target.value })
                }
                placeholder="z.B. 55000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Stellenbeschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              placeholder="Beschreiben Sie die Position..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Anforderungen</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              rows={3}
              placeholder="Was sollte der Bewerber mitbringen?"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gespeichert...
                </>
              ) : job ? (
                "Speichern"
              ) : (
                "Stelle erstellen"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployerJobModal;
