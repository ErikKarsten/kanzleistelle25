import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Scale,
  BookOpen,
  Users,
  Clock,
  Briefcase,
  Award,
  Star,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { applicationSchema } from "@/lib/validations";
import { isPlz, resolveOrtFromPlz } from "@/lib/geo";
import ApplySuccessStep from "./ApplySuccessStep";

interface InitiativeApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roles = [
  { id: "steuerfachangestellte", label: "Steuerfachangestellte*r", sublabel: "(m/w/d)", icon: Calculator },
  { id: "steuerberater", label: "Steuerberater*in", sublabel: "(m/w/d)", icon: Scale },
  { id: "bilanzbuchhalter", label: "Finanz/Bilanzbuchhalter*in", sublabel: "(m/w/d)", icon: BookOpen },
  { id: "lohnbuchhalter", label: "Lohnbuchhalter*in", sublabel: "(m/w/d)", icon: Users },
];

const experienceLevels = [
  { id: "0-1", label: "0-1 Jahre", icon: Clock, description: "Berufseinsteiger" },
  { id: "2-3", label: "2-3 Jahre", icon: Briefcase, description: "Erste Erfahrung" },
  { id: "4-6", label: "4-6 Jahre", icon: Award, description: "Erfahren" },
  { id: "7+", label: "7+ Jahre", icon: Star, description: "Experte" },
];

const InitiativeApplyModal = ({ open, onOpenChange }: InitiativeApplyModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    role: "",
    experience: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    postalCode: "",
    deutschlandweit: false,
  });
  const [resolvedOrt, setResolvedOrt] = useState<string | null>(null);
  const [resolvingOrt, setResolvingOrt] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // PLZ -> Ortsname auflösen (debounced), sobald eine gültige PLZ eingegeben wurde
  useEffect(() => {
    if (formData.deutschlandweit || !isPlz(formData.postalCode)) {
      setResolvedOrt(null);
      return;
    }
    setResolvingOrt(true);
    const timer = setTimeout(async () => {
      const ort = await resolveOrtFromPlz(formData.postalCode);
      setResolvedOrt(ort);
      setResolvingOrt(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.postalCode, formData.deutschlandweit]);

  const resetForm = () => {
    setCurrentStep(1);
    setApplicationId(null);
    setFormData({ role: "", experience: "", firstName: "", lastName: "", email: "", phone: "", postalCode: "", deutschlandweit: false });
    setResolvedOrt(null);
    setResolvingOrt(false);
    setPrivacyAccepted(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const validated = applicationSchema.parse(formData);
      const generatedId = crypto.randomUUID();

      const insertData: Record<string, any> = {
        id: generatedId,
        job_id: null,
        company_id: null,
        first_name: validated.firstName,
        last_name: validated.lastName,
        email: validated.email,
        phone: validated.phone,
        applicant_role: validated.role,
        experience: validated.experience,
        internal_notes: "source: initiative",
        cover_letter: "Initiativbewerbung – Bewerber hat sich ohne spezifische Stellenanzeige beworben.",
      };

      // Aktueller Wohnort / gewünschte Arbeitsregion (optional, teilen sich location/postal_code)
      if (formData.deutschlandweit) {
        insertData.location = "Deutschlandweit verfügbar";
        insertData.postal_code = "00000";
      } else if (isPlz(formData.postalCode)) {
        insertData.postal_code = formData.postalCode;
        insertData.location = resolvedOrt ? `${formData.postalCode} ${resolvedOrt}` : formData.postalCode;
      }

      const { error } = await supabase.from("applications").insert(insertData as any);

      if (error) {
        console.dir(error, { depth: null });
        throw error;
      }

      return { success: true, applicationId: generatedId };
    },
    onSuccess: (result) => {
      setApplicationId(result.applicationId);
      setCurrentStep(4);
    },
    onError: (error: any) => {
      const zodErrors = error?.issues?.map((i: any) => i.message).join(", ");
      toast({
        title: "Fehler beim Absenden",
        description: zodErrors || error?.message || "Unbekannter Fehler",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({ title: "Fehlende Angaben", description: "Bitte alle Pflichtfelder ausfüllen.", variant: "destructive" });
      return;
    }
    if (!privacyAccepted) {
      toast({ title: "Datenschutz-Einwilligung fehlt", description: "Bitte stimmen Sie der Datenverarbeitung zu, um fortzufahren.", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  const canProceedToStep2 = formData.role !== "";
  const canProceedToStep3 = formData.experience !== "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {currentStep !== 4 && (
          <div className="shrink-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-primary-foreground flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6" />
                Initiativ bewerben
              </DialogTitle>
              <p className="text-center text-primary-foreground/90 text-sm mt-2">
                Keine passende Stelle gefunden? Kein Problem – wir finden die richtige Kanzlei für dich!
              </p>
            </DialogHeader>

            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    currentStep >= step ? "bg-white text-primary" : "bg-primary-foreground/20 text-primary-foreground/60"
                  )}>
                    {currentStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={cn("w-12 h-1 mx-1 rounded transition-all", currentStep > step ? "bg-white" : "bg-primary-foreground/20")} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 -mt-4 bg-background rounded-t-2xl relative">
          {/* Step 1: Role */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Schritt 1 von 3</p>
                <h3 className="text-lg font-semibold text-foreground">Was ist deine aktuelle Rolle?</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, role: role.id }))}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:shadow-lg",
                        isSelected
                          ? "border-[hsl(45,90%,50%)] bg-[hsl(220,60%,25%)]/5 shadow-lg ring-2 ring-[hsl(45,90%,50%)]/30"
                          : "border-border hover:border-[hsl(220,60%,25%)]/50"
                      )}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all shadow-md",
                        isSelected
                          ? "bg-[hsl(220,60%,25%)] text-[hsl(45,100%,95%)] ring-2 ring-[hsl(45,90%,50%)]"
                          : "bg-[hsl(220,60%,25%)]/10 text-[hsl(220,60%,25%)]"
                      )}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="text-sm font-semibold text-center text-foreground">{role.label}</span>
                      {role.sublabel && <span className="text-xs text-muted-foreground">{role.sublabel}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Experience */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Schritt 2 von 3</p>
                <h3 className="text-lg font-semibold text-foreground">Wie viel Berufserfahrung bringst du mit?</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {experienceLevels.map((level) => {
                  const Icon = level.icon;
                  const isSelected = formData.experience === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, experience: level.id }))}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:shadow-lg",
                        isSelected
                          ? "border-[hsl(45,90%,50%)] bg-[hsl(220,60%,25%)]/5 shadow-lg ring-2 ring-[hsl(45,90%,50%)]/30"
                          : "border-border hover:border-[hsl(220,60%,25%)]/50"
                      )}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all shadow-md",
                        isSelected
                          ? "bg-[hsl(220,60%,25%)] text-[hsl(45,100%,95%)] ring-2 ring-[hsl(45,90%,50%)]"
                          : "bg-[hsl(220,60%,25%)]/10 text-[hsl(220,60%,25%)]"
                      )}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{level.label}</span>
                      <span className="text-xs text-muted-foreground">{level.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {currentStep === 3 && (
            <form id="initiativeApplyForm" onSubmit={handleSubmit} className="space-y-2">
              <div className="text-center mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Schritt 3 von 3</p>
                <h3 className="text-lg font-semibold text-foreground">Wie können wir dich erreichen?</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="init-firstName">Vorname *</Label>
                  <Input id="init-firstName" placeholder="Max" value={formData.firstName} onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="init-lastName">Nachname *</Label>
                  <Input id="init-lastName" placeholder="Mustermann" value={formData.lastName} onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="init-email">E-Mail *</Label>
                <Input id="init-email" type="email" placeholder="max@beispiel.de" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="init-phone">Telefonnummer *</Label>
                <Input id="init-phone" type="tel" placeholder="+49 123 456789" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} required />
              </div>

              <div className="space-y-1 pt-1 border-t">
                <Label htmlFor="init-postalCode">Aktueller Wohnort (optional)</Label>
                <Input
                  id="init-postalCode"
                  placeholder="PLZ, z.B. 97421"
                  inputMode="numeric"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, postalCode: e.target.value.replace(/\D/g, "").slice(0, 5) }))
                  }
                  disabled={formData.deutschlandweit}
                  maxLength={5}
                />
                {formData.postalCode && !isPlz(formData.postalCode) && (
                  <p className="text-xs text-destructive">Bitte eine gültige 5-stellige PLZ eingeben.</p>
                )}
                {resolvingOrt && (
                  <p className="text-xs text-muted-foreground">Ort wird ermittelt…</p>
                )}
                {!resolvingOrt && resolvedOrt && (
                  <p className="text-xs text-muted-foreground">📍 {formData.postalCode} {resolvedOrt}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="init-deutschlandweit"
                    checked={formData.deutschlandweit}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, deutschlandweit: e.target.checked, postalCode: e.target.checked ? "" : p.postalCode }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="init-deutschlandweit" className="text-xs text-muted-foreground">
                    Ich bin deutschlandweit verfügbar
                  </label>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Deine Auswahl:</span>{" "}
                  {roles.find((r) => r.id === formData.role)?.label} · {experienceLevels.find((e) => e.id === formData.experience)?.label}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="init-privacy"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="init-privacy" className="text-xs text-muted-foreground">
                  Ich stimme der Verarbeitung meiner Daten (Name, E-Mail, Telefonnummer) gemäß der{" "}
                  <a href="/datenschutz" target="_blank" className="text-primary underline hover:no-underline">
                    Datenschutzerklärung
                  </a>{" "}
                  zu. Meine Daten werden nicht an Dritte weitergegeben.
                </label>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Deine Initiativbewerbung ist eingegangen! 🎉</h3>
              <p className="text-muted-foreground">
                Neele und unser Team prüfen dein Profil und melden sich bei dir, sobald wir eine passende Kanzlei für dich gefunden haben.
              </p>
              <Button onClick={() => handleOpenChange(false)} className="mt-4">
                Alles klar!
              </Button>
            </div>
          )}

          {/* Footer */}
          {currentStep !== 4 && (
            <div className="mt-6 pt-4 border-t flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Initiativbewerbung – Wir finden die perfekte Kanzlei für dich</span>
            </div>
          )}
        </div>

        {/* Fixierter Footer mit Navigations-/Absende-Button, bleibt beim Scrollen sichtbar */}
        {currentStep !== 4 && (
          <div className="shrink-0 border-t p-4 bg-background">
            {currentStep === 1 && (
              <Button onClick={() => setCurrentStep(2)} disabled={!canProceedToStep2} className="w-full" size="lg">
                Weiter <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {currentStep === 2 && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
                </Button>
                <Button onClick={() => setCurrentStep(3)} disabled={!canProceedToStep3} className="flex-1" size="lg">
                  Weiter <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
            {currentStep === 3 && (
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
                </Button>
                <Button
                  type="submit"
                  form="initiativeApplyForm"
                  className="flex-1"
                  size="lg"
                  disabled={mutation.isPending || !privacyAccepted}
                >
                  {mutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Wird gesendet...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Initiativ bewerben</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InitiativeApplyModal;
