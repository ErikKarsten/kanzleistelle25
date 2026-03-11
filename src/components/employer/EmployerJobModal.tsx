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
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Plus, X } from "lucide-react";
import { jobSchema } from "@/lib/validations";

interface EmployerJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any | null;
  companyId: string | null;
  companyName: string;
}

const REQUIREMENT_SUGGESTIONS = [
  "DATEV-Kenntnisse",
  "Teamfähigkeit",
  "Eigenständige Arbeitsweise",
  "Berufserfahrung",
  "Abgeschlossene Ausbildung",
];

const BENEFIT_SUGGESTIONS = [
  "Homeoffice möglich",
  "30 Tage Urlaub",
  "Fortbildungen",
  "Kostenlose Getränke",
  "Modernes Büro",
  "Fahrtkostenzuschuss",
];

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
    working_model: "vor_ort",
    description: "",
    salary_range: "",
    contact_person_id: "",
  });
  const [requirements, setRequirements] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [requirementInput, setRequirementInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        location: job.location || "",
        employment_type: job.employment_type || "vollzeit",
        working_model: job.working_model || "vor_ort",
        description: job.description || "",
        salary_range: job.salary_range || (job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max} €` : ""),
        contact_person_id: job.contact_person_id || "",
      });
      // Parse requirements from string or array
      if (job.requirements) {
        try {
          const parsed = JSON.parse(job.requirements);
          setRequirements(Array.isArray(parsed) ? parsed : job.requirements.split("\n").filter(Boolean));
        } catch {
          setRequirements(job.requirements.split("\n").filter(Boolean));
        }
      } else {
        setRequirements([]);
      }
      setBenefits(Array.isArray(job.benefits) ? job.benefits : []);
    } else {
      setFormData({
        title: "",
        location: "",
        employment_type: "vollzeit",
        working_model: "vor_ort",
        description: "",
        salary_range: "",
        contact_person_id: "",
      });
      setRequirements([]);
      setBenefits([]);
    }
    setRequirementInput("");
    setBenefitInput("");
  }, [job, open]);

  // Fetch contact persons for this company
  const { data: contactPersons } = useQuery({
    queryKey: ["contact-persons", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("contact_persons")
        .select("*")
        .eq("company_id", companyId)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && open,
  });

  const toggleTag = (
    value: string,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    if (list.includes(value)) {
      setList(list.filter((v) => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const addCustomTag = (
    input: string,
    setInput: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    const val = input.trim();
    if (val && !list.includes(val)) {
      setList([...list, val]);
    }
    setInput("");
  };

  const removeTag = (
    value: string,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    setList(list.filter((v) => v !== value));
  };

  const createJobMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId)
        throw new Error(
          "Kanzlei-Profil nicht gefunden. Bitte Profil vervollständigen."
        );

      const { error } = await supabase.from("jobs").insert({
        title: data.title,
        company: companyName,
        company_id: companyId,
        location: data.location || null,
        employment_type: data.employment_type || null,
        working_model: data.working_model || null,
        description: data.description || null,
        requirements: requirements.length > 0 ? requirements.join("\n") : null,
        benefits: benefits.length > 0 ? benefits : [],
        salary_range: data.salary_range || null,
        contact_person_id: data.contact_person_id || null,
        is_active: false,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      toast({ title: "Stelle eingereicht!", description: "Deine Stelle wird nach Admin-Freigabe veröffentlicht." });
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

      const wasPublished = job.status === "published";

      const { error } = await supabase
        .from("jobs")
        .update({
          title: data.title,
          location: data.location || null,
          employment_type: data.employment_type || null,
          working_model: data.working_model || null,
          description: data.description || null,
          requirements: requirements.length > 0 ? requirements.join("\n") : null,
          benefits: benefits.length > 0 ? benefits : [],
          salary_range: data.salary_range || null,
          contact_person_id: data.contact_person_id || null,
        })
        .eq("id", job.id);
      if (error) throw error;

      // Send admin notification if job was published and will be reset to pending_review
      if (wasPublished) {
        try {
          const { buildJobPendingReviewEmail } = await import("@/lib/emailTemplates");
          const emailData = buildJobPendingReviewEmail({
            jobTitle: data.title,
            companyName,
          });
          await supabase.functions.invoke("send-contact-email", {
            body: {
              to_email: "info@kanzleistelle24.de",
              to_name: "Kanzleistelle24 Admin",
              subject: emailData.subject,
              html: emailData.html,
            },
          });
        } catch (emailErr) {
          console.error("Admin notification email failed:", emailErr);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      const wasPublished = job?.status === "published";
      toast({
        title: wasPublished ? "Stelle zur Prüfung eingereicht" : "Stelle aktualisiert!",
        description: wasPublished
          ? "Die Anzeige wird nach erneuter Freigabe durch unser Team wieder veröffentlicht."
          : undefined,
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { employerJobSchema } = await import("@/lib/validations");
      employerJobSchema.parse(formData);
    } catch (err: any) {
      const msg = err?.issues?.map((i: any) => i.message).join(", ") || "Ungültige Eingabe";
      toast({ title: "Validierungsfehler", description: msg, variant: "destructive" });
      return;
    }
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

        {/* Info Banner for new jobs */}
        {!job && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
            <p>
              <strong>Hinweis zur Veröffentlichung:</strong> Deine Stelle wird aktuell geprüft und nach Freigabe durch den Admin veröffentlicht.
            </p>
          </div>
        )}

        {/* Warning banner when editing a published job */}
        {job?.status === "published" && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
            <p>
              <strong>⚠️ Achtung:</strong> Nach dem Speichern der Änderungen wird die Anzeige zur Sicherheit erneut durch unser Team geprüft und kurzzeitig offline genommen.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="title">Jobtitel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="z.B. Steuerfachangestellte/r"
            />
          </div>

          {/* Standort & Anstellungsart */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Standort</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="z.B. München"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment_type">Anstellungsart</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
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

          {/* Arbeitsmodell & Gehaltsrahmen */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="working_model">Arbeitsmodell</Label>
              <Select
                value={formData.working_model}
                onValueChange={(value) => setFormData({ ...formData, working_model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vor_ort">Vor Ort</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_range">Gehaltsrahmen (optional)</Label>
              <Input
                id="salary_range"
                value={formData.salary_range}
                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                placeholder="z.B. 45.000 - 55.000 €"
              />
            </div>
          </div>

          {/* Ansprechpartner */}
          {contactPersons && contactPersons.length > 0 && (
            <div className="space-y-2">
              <Label>Zuständiger Ansprechpartner</Label>
              <Select
                value={formData.contact_person_id}
                onValueChange={(value) => setFormData({ ...formData, contact_person_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ansprechpartner wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {contactPersons.map((cp: any) => (
                    <SelectItem key={cp.id} value={cp.id}>
                      {cp.name}{cp.is_primary ? " (Hauptkontakt)" : ""}{cp.role && cp.role !== "Ansprechpartner" ? ` – ${cp.role}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Wird auf der öffentlichen Stellenanzeige angezeigt.
              </p>
            </div>
          )}

          {/* Beschreibung */}
          <div className="space-y-2">
            <Label htmlFor="description">Stellenbeschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Beschreiben Sie die Position..."
            />
          </div>

          {/* Anforderungen */}
          <div className="space-y-3">
            <Label>Anforderungen</Label>
            <div className="flex gap-2">
              <Input
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                placeholder="Eigene Anforderung eingeben..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag(requirementInput, setRequirementInput, requirements, setRequirements);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addCustomTag(requirementInput, setRequirementInput, requirements, setRequirements)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Hinzufügen
              </Button>
            </div>
            {/* Vorschläge */}
            <div className="flex flex-wrap gap-2">
              {REQUIREMENT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleTag(s, requirements, setRequirements)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    requirements.includes(s)
                  ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Ausgewählte Tags */}
            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {requirements.map((r) => (
                  <span
                    key={r}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground"
                  >
                    {r}
                    <button type="button" onClick={() => removeTag(r, requirements, setRequirements)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <Label>Benefits</Label>
            <div className="flex gap-2">
              <Input
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                placeholder="Eigenen Benefit eingeben..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag(benefitInput, setBenefitInput, benefits, setBenefits);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addCustomTag(benefitInput, setBenefitInput, benefits, setBenefits)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Hinzufügen
              </Button>
            </div>
            {/* Vorschläge */}
            <div className="flex flex-wrap gap-2">
              {BENEFIT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleTag(s, benefits, setBenefits)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    benefits.includes(s)
                      ? "bg-[hsl(var(--primary))] text-white border-primary"
                      : "bg-background border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Ausgewählte Tags */}
            {benefits.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {benefits.map((b) => (
                  <span
                    key={b}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary text-white"
                  >
                    {b}
                    <button type="button" onClick={() => removeTag(b, benefits, setBenefits)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground px-8 py-3 text-base font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gespeichert...
                </>
              ) : job ? (
                "Speichern"
              ) : (
                "Stelle veröffentlichen"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployerJobModal;
