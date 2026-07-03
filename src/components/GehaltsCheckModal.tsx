import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Star } from "lucide-react";
import InitiativeApplyModal from "@/components/InitiativeApplyModal";

interface GehaltsCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JOBS = [
  { value: "Steuerfachangestellte", label: "Steuerfachangestellte", emoji: "📊" },
  { value: "Bilanzbuchhalter", label: "Bilanzbuchhalter", emoji: "📈" },
  { value: "Steuerberater", label: "Steuerberater", emoji: "⚖️" },
];

const LEVELS = [
  { value: "junior", label: "Junior", sublabel: "0–2 Jahre", emoji: "🌱" },
  { value: "mid", label: "Mid-Level", sublabel: "2–5 Jahre", emoji: "💼" },
  { value: "senior", label: "Senior", sublabel: "5+ Jahre", emoji: "🏆" },
];

const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
];

interface SalaryResult {
  salary_min: number;
  salary_median: number;
  salary_max: number;
}

const fmt = (n: number) => n.toLocaleString("de-DE") + " €";

// Steps: 1 Beruf · 2 Erfahrung · 3 Bundesland · 4 Gehalt · 5 Kontakt · 6 Ergebnis
const TOTAL_STEPS = 5;

const GehaltsCheckModal = ({ open, onOpenChange }: GehaltsCheckModalProps) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  const reset = () => {
    setStep(1);
    setSelectedJob("");
    setSelectedLevel("");
    setSelectedState("");
    setCurrentSalary("");
    setName("");
    setEmail("");
    setPrivacyAccepted(false);
    setResult(null);
    setLoading(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !privacyAccepted) return;
    setLoading(true);

    const levelLabel = LEVELS.find((l) => l.value === selectedLevel)?.label ?? selectedLevel;

    await supabase.from("contact_leads").insert({
      full_name: name.trim(),
      email: email.trim(),
      message: `Gehaltscheck: ${selectedJob} / ${levelLabel} / ${selectedState} / Aktuelles Gehalt: ${currentSalary || "nicht angegeben"}`,
      source_url: "/gehaltscheck",
    });

    // salary_data is not in generated types yet — cast to any
    const { data } = await (supabase as any)
      .from("salary_data")
      .select("salary_min, salary_median, salary_max")
      .eq("job_type", selectedJob)
      .eq("experience_level", selectedLevel)
      .eq("bundesland", selectedState)
      .single();

    setResult(data ?? null);
    setLoading(false);
    setStep(6);
  };

  const progressPercent = step <= TOTAL_STEPS ? (step / TOTAL_STEPS) * 100 : 100;

  const BackButton = ({ to }: { to: number }) => (
    <button
      onClick={() => setStep(to)}
      className="flex items-center gap-1 text-sm text-muted-foreground mt-4 hover:text-foreground transition-colors"
    >
      <ChevronLeft className="h-4 w-4" /> Zurück
    </button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          {step <= TOTAL_STEPS && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Schritt {step} von {TOTAL_STEPS}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* SCHRITT 1 — Beruf */}
          {step === 1 && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl">Welchen Beruf üben Sie aus?</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 mt-6">
                {JOBS.map((job) => (
                  <button
                    key={job.value}
                    onClick={() => { setSelectedJob(job.value); setStep(2); }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${
                      selectedJob === job.value ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <span className="text-3xl">{job.emoji}</span>
                    <span className="font-semibold text-base">{job.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SCHRITT 2 — Erfahrung */}
          {step === 2 && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl">Wie viel Erfahrung haben Sie?</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 mt-6">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    onClick={() => { setSelectedLevel(lvl.value); setStep(3); }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${
                      selectedLevel === lvl.value ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <span className="text-3xl">{lvl.emoji}</span>
                    <div>
                      <div className="font-semibold text-base">{lvl.label}</div>
                      <div className="text-sm text-muted-foreground">{lvl.sublabel}</div>
                    </div>
                  </button>
                ))}
              </div>
              <BackButton to={1} />
            </div>
          )}

          {/* SCHRITT 3 — Bundesland */}
          {step === 3 && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl">In welchem Bundesland arbeiten Sie?</DialogTitle>
              </DialogHeader>
              <div className="mt-6 space-y-4">
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Bundesland wählen …" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUNDESLAENDER.map((bl) => (
                      <SelectItem key={bl} value={bl}>{bl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full h-12"
                  disabled={!selectedState}
                  onClick={() => setStep(4)}
                >
                  Weiter
                </Button>
              </div>
              <BackButton to={2} />
            </div>
          )}

          {/* SCHRITT 4 — Aktuelles Gehalt (optional) */}
          {step === 4 && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl">Ihr aktuelles Gehalt</DialogTitle>
              </DialogHeader>
              <div className="text-center mb-6 mt-2">
                <p className="text-muted-foreground text-sm">
                  Optional — hilft uns Ihnen bessere Stellen zu empfehlen.
                </p>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Aktuelles Jahresbrutto (optional)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="z.B. 38000"
                    value={currentSalary}
                    onChange={(e) => setCurrentSalary(e.target.value)}
                    className="w-full border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute right-4 top-3 text-muted-foreground">€</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ihre Angabe wird vertraulich behandelt und nicht weitergegeben.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Zurück
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1">
                  Weiter
                </Button>
              </div>
            </div>
          )}

          {/* SCHRITT 5 — Kontaktdaten */}
          {step === 5 && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl">Fast geschafft!</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-1">
                Wo sollen wir Ihr persönliches Ergebnis anzeigen?
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="gc-name">Name</Label>
                  <Input
                    id="gc-name"
                    placeholder="Ihr Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="gc-email">E-Mail</Label>
                  <Input
                    id="gc-email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 h-12"
                  />
                </div>
                <div className="flex items-start gap-3 mt-4">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="privacy" className="text-xs text-muted-foreground">
                    Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
                    <a href="/datenschutz" target="_blank" className="text-primary underline hover:no-underline">
                      Datenschutzerklärung
                    </a>{" "}
                    zu. Meine Daten werden nicht an Dritte weitergegeben.
                  </label>
                </div>
                <Button
                  className="w-full h-12"
                  disabled={!name.trim() || !email.trim() || !privacyAccepted || loading}
                  onClick={handleSubmit}
                >
                  {loading ? "Wird geladen …" : "Mein Gehalt anzeigen →"}
                </Button>
              </div>
              <BackButton to={4} />
            </div>
          )}

          {/* SCHRITT 6 — Ergebnis */}
          {step === 6 && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl">Ihr Gehaltscheck-Ergebnis</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-secondary text-xs px-2 py-0.5 rounded">{selectedJob}</span>
                <span className="bg-secondary text-xs px-2 py-0.5 rounded">
                  {LEVELS.find((l) => l.value === selectedLevel)?.label}
                </span>
                <span className="bg-secondary text-xs px-2 py-0.5 rounded">{selectedState}</span>
              </div>

              {result ? (
                <div className="mt-6">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-xl bg-secondary/60">
                      <div className="text-xs text-muted-foreground mb-1">Einstieg</div>
                      <div className="text-lg font-bold">{fmt(result.salary_min)}</div>
                    </div>
                    <div className="relative p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <Star className="absolute top-2 right-2 h-3 w-3 text-primary" />
                      <div className="text-xs text-primary font-semibold mb-1">Median</div>
                      <div className="text-lg font-bold text-primary">{fmt(result.salary_median)}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/60">
                      <div className="text-xs text-muted-foreground mb-1">Top</div>
                      <div className="text-lg font-bold">{fmt(result.salary_max)}</div>
                    </div>
                  </div>

                  {/* Salary bar */}
                  <div className="mt-5">
                    <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-primary/20 rounded-full" />
                      <div
                        className="absolute h-full bg-primary rounded-full"
                        style={{
                          left: `${(result.salary_min / result.salary_max) * 100}%`,
                          width: `${((result.salary_median - result.salary_min) / result.salary_max) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{fmt(result.salary_min)}</span>
                      <span className="text-primary font-semibold">{fmt(result.salary_median)}</span>
                      <span>{fmt(result.salary_max)}</span>
                    </div>
                  </div>

                  {/* Persönlicher Gehaltsvergleich */}
                  <div className="mt-4">
                    {!currentSalary ? (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                        <p className="font-bold text-primary text-lg">
                          🎯 Wie schlägt sich Ihr Gehalt im Vergleich?
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Viele Steuerfachkräfte verdienen mehr als sie denken —
                          oder weniger als möglich. Schauen Sie sich unsere aktuellen Angebote an!
                        </p>
                      </div>
                    ) : Number(currentSalary) < result.salary_median ? (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                        <p className="font-bold text-orange-700 text-lg">
                          📈 Sie verdienen{" "}
                          {(result.salary_median - Number(currentSalary)).toLocaleString("de-DE")} €{" "}
                          unter dem Marktdurchschnitt
                        </p>
                        <p className="text-sm text-orange-600 mt-2">
                          In unseren aktuellen Stellenangeboten finden sich Positionen,
                          die deutlich besser vergütet werden. Ein Wechsel könnte sich für Sie lohnen!
                        </p>
                      </div>
                    ) : Number(currentSalary) < result.salary_max ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p className="font-bold text-blue-700 text-lg">
                          💼 Sie liegen gut im Markt — aber da geht noch mehr!
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                          Top-Kanzleien zahlen bis zu {result.salary_max.toLocaleString("de-DE")} €
                          für Ihr Profil. Mit dem richtigen Arbeitgeber ist mehr drin!
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="font-bold text-green-700 text-lg">
                          🏆 Sie gehören zu den Top-Verdienern Ihrer Branche!
                        </p>
                        <p className="text-sm text-green-600 mt-2">
                          Ihr Gehalt ist überdurchschnittlich — aber sind auch Entwicklungsmöglichkeiten,
                          Flexibilität und Teamkultur bei Ihrem Arbeitgeber top? Schauen Sie mal rein!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-6 rounded-xl bg-secondary/50 text-center text-sm text-muted-foreground">
                  Für diese Kombination liegen uns noch keine Gehaltsdaten vor.
                  <br />
                  Unsere Berater helfen Ihnen gerne persönlich weiter.
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1"
                  onClick={() => { handleOpenChange(false); navigate("/stellenangebote"); }}
                >
                  Passende Stellen ansehen →
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { handleOpenChange(false); setApplyOpen(true); }}
                >
                  Initiativ bewerben →
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <InitiativeApplyModal open={applyOpen} onOpenChange={setApplyOpen} />
    </>
  );
};

export default GehaltsCheckModal;
