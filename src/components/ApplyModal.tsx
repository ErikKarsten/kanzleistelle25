import { useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ApplySuccessStep from "./ApplySuccessStep";

interface ApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  company: string;
}

const roles = [
  { 
    id: "steuerfachangestellte", 
    label: "Steuerfachangestellte*r", 
    sublabel: "(m/w/d)",
    icon: Calculator,
    color: "bg-[hsl(220,60%,25%)] text-[hsl(45,100%,95%)]"
  },
  { 
    id: "steuerberater", 
    label: "Steuerberater*in", 
    sublabel: "(m/w/d)",
    icon: Scale,
    color: "bg-[hsl(220,60%,25%)] text-[hsl(45,100%,95%)]"
  },
  { 
    id: "bilanzbuchhalter", 
    label: "Finanz/Bilanzbuchhalter*in", 
    sublabel: "(m/w/d)",
    icon: BookOpen,
    color: "bg-[hsl(220,60%,25%)] text-[hsl(45,100%,95%)]"
  },
  { 
    id: "lohnbuchhalter", 
    label: "Lohnbuchhalter*in", 
    sublabel: "(m/w/d)",
    icon: Users,
    color: "bg-[hsl(220,60%,25%)] text-[hsl(45,100%,95%)]"
  },
];

const experienceLevels = [
  { id: "0-1", label: "0-1 Jahre", icon: Clock, description: "Berufseinsteiger" },
  { id: "2-3", label: "2-3 Jahre", icon: Briefcase, description: "Erste Erfahrung" },
  { id: "4-6", label: "4-6 Jahre", icon: Award, description: "Erfahren" },
  { id: "7+", label: "7+ Jahre", icon: Star, description: "Experte" },
];

const ApplyModal = ({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  company,
}: ApplyModalProps) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    role: "",
    experience: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const resetForm = () => {
    setCurrentStep(1);
    setApplicationId(null);
    setFormData({
      role: "",
      experience: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      // Validate job_id is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!jobId || !uuidRegex.test(jobId)) {
        console.error("Invalid job_id format:", jobId);
        throw new Error("Ungültige Job-ID");
      }

      const insertData = {
        job_id: jobId,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        applicant_role: formData.role,
        experience: formData.experience,
        applicant_id: null,
      };
      
      console.log("Submitting application with data:", insertData);
      
      const { data, error } = await supabase.from("applications").insert(insertData).select('id').single();
      
      if (error) {
        console.error("Supabase insert error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log("Application submitted successfully:", data);
      return data;
    },
    onSuccess: (data) => {
      setApplicationId(data.id);
      setCurrentStep(4); // Go to success step
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: any) => {
      console.error("Application mutation error:", error);
      const errorMessage = error?.message || "Unbekannter Fehler";
      toast({
        title: "Fehler beim Absenden",
        description: `${errorMessage}. Bitte versuchen Sie es erneut.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate();
  };

  const canProceedToStep2 = formData.role !== "";
  const canProceedToStep3 = formData.experience !== "";

  const progressPercent = ((currentStep - 1) / 2) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header with progress - hide on success step */}
        {currentStep !== 4 && (
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-primary-foreground">
                In 30 Sekunden bewerben
              </DialogTitle>
              <p className="text-center text-primary-foreground/90 text-sm mt-2">
                Ohne Anschreiben, ohne Lebenslauf
              </p>
            </DialogHeader>
            
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      currentStep >= step 
                        ? "bg-white text-primary" 
                        : "bg-primary-foreground/20 text-primary-foreground/60"
                    )}
                  >
                    {currentStep > step ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div 
                      className={cn(
                        "w-12 h-1 mx-1 rounded transition-all",
                        currentStep > step 
                          ? "bg-white" 
                          : "bg-primary-foreground/20"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 -mt-4 bg-background rounded-t-2xl relative">
          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Schritt 1 von 3</p>
                <h3 className="text-lg font-semibold text-foreground">
                  Was ist deine aktuelle Rolle?
                </h3>
                <p className="text-sm text-muted-foreground">Fast geschafft! Nur noch wenige Klicks bis zu deinem Traumjob.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
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
                      {role.sublabel && (
                        <span className="text-xs text-muted-foreground">{role.sublabel}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!canProceedToStep2}
                className="w-full mt-4"
                size="lg"
              >
                Weiter
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Experience */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Schritt 2 von 3</p>
                <h3 className="text-lg font-semibold text-foreground">
                  Wie viel Berufserfahrung bringst du mit?
                </h3>
                <p className="text-sm text-muted-foreground">Super! Noch ein kleiner Schritt.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {experienceLevels.map((level) => {
                  const Icon = level.icon;
                  const isSelected = formData.experience === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, experience: level.id }))}
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
              <div className="flex gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                  size="lg"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)} 
                  disabled={!canProceedToStep3}
                  className="flex-1"
                  size="lg"
                >
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Info */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Schritt 3 von 3</p>
                <h3 className="text-lg font-semibold text-foreground">
                  Fast geschafft! Wie können wir dich erreichen?
                </h3>
                <p className="text-sm text-muted-foreground">Gleich hast du es geschafft!</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname *</Label>
                  <Input
                    id="firstName"
                    placeholder="Max"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname *</Label>
                  <Input
                    id="lastName"
                    placeholder="Mustermann"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="max.mustermann@beispiel.de"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+49 123 456789"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Deine Auswahl:</p>
                <p>Rolle: {roles.find(r => r.id === formData.role)?.label}</p>
                <p>Erfahrung: {experienceLevels.find(e => e.id === formData.experience)?.label}</p>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setCurrentStep(2)}
                  className="flex-1"
                  size="lg"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Jetzt bewerben
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Success with optional CV upload */}
          {currentStep === 4 && applicationId && (
            <ApplySuccessStep
              firstName={formData.firstName}
              applicationId={applicationId}
              company={company}
              onClose={() => handleOpenChange(false)}
            />
          )}

          {/* Job info footer - hide on success step */}
          {currentStep !== 4 && (
            <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
              Bewerbung für <span className="font-medium text-foreground">{jobTitle}</span> bei{" "}
              <span className="font-medium text-foreground">{company}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyModal;
