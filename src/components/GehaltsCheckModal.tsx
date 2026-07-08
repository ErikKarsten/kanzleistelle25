import { useState, useEffect } from "react";
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
  const [telefon, setTelefon] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    supabase
      .from('jobs')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
      .eq('status', 'published')
      .then(({ count }) => setJobCount(count || 0));
  }, []);

  const reset = () => {
    setStep(1);
    setSelectedJob("");
    setSelectedLevel("");
    setSelectedState("");
    setCurrentSalary("");
    setName("");
    setEmail("");
    setTelefon("");
    setPrivacyAccepted(false);
    setResult(null);
    setLoading(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const phoneRegex = /^[\d\s+()/-]{6,20}$/;
  const isTelefonValid = phoneRegex.test(telefon.trim());

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !isTelefonValid || !privacyAccepted) return;
    setLoading(true);

    const levelLabel = LEVELS.find((l) => l.value === selectedLevel)?.label ?? selectedLevel;

    await supabase.from("contact_leads").insert({
      full_name: name.trim(),
      email: email.trim(),
      telefon: telefon.trim(),
      message: `Gehaltscheck: ${selectedJob} / ${levelLabel} / ${selectedState} / Aktuelles Gehalt: ${currentSalary || "nicht angegeben"}`,
      source_url: "/gehaltscheck",
    });

    supabase.functions.invoke("send-salary-tips", {
      body: {
        name: name.trim(),
        email: email.trim(),
        telefon: telefon.trim(),
        beruf: selectedJob,
        erfahrung: selectedLevel,
        bundesland: selectedState,
        currentSalary: currentSalary || null,
      },
    }).catch(() => {});

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
                <div>
                  <Label htmlFor="gc-telefon">Telefonnummer</Label>
                  <Input
                    id="gc-telefon"
                    type="tel"
                    placeholder="+49 89 123456"
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    className={`mt-1 h-12 ${telefon && !isTelefonValid ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  />
                  {telefon && !isTelefonValid && (
                    <p className="text-xs text-red-500 mt-1">Bitte geben Sie eine gültige Telefonnummer ein.</p>
                  )}
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
                    Ich stimme der Verarbeitung meiner Daten (Name, E-Mail, Telefonnummer) gemäß der{" "}
                    <a href="/datenschutz" target="_blank" className="text-primary underline hover:no-underline">
                      Datenschutzerklärung
                    </a>{" "}
                    zu. Meine Daten werden nicht an Dritte weitergegeben.
                  </label>
                </div>
                <Button
                  className="w-full h-12"
                  disabled={!name.trim() || !email.trim() || !isTelefonValid || !privacyAccepted || loading}
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

                  {/* Eyecatcher */}
                  {(() => {
                    const currentSal = Number(currentSalary) || 0;
                    const diff = result.salary_max - currentSal;

                    let emoji: string;
                    let titel: string;
                    let text: string;
                    let badges: { icon: string; label: string }[] | null = null;

                    if (!currentSalary) {
                      emoji = "🎯";
                      titel = "Mehr verdienen ist möglich!";
                      text = `Top-Kanzleien zahlen bis zu ${result.salary_max.toLocaleString('de-DE')} € für Ihr Profil`;
                    } else if (currentSal < result.salary_median * 0.9) {
                      emoji = "📈";
                      titel = `Sie könnten bis zu ${diff.toLocaleString('de-DE')} € mehr verdienen!`;
                      text = "Ihr aktuelles Gehalt liegt unter dem Marktdurchschnitt. Ein Wechsel könnte sich deutlich lohnen.";
                    } else if (currentSal <= result.salary_max) {
                      emoji = "⚖️";
                      titel = diff > 0
                        ? `${diff.toLocaleString('de-DE')} € Luft nach oben — aber Gehalt ist nicht alles!`
                        : "Sie liegen gut im Markt — aber Gehalt ist nicht alles!";
                      text = "Neben dem Gehalt zählen auch Entwicklungsperspektiven, Flexibilität, Homeoffice und Teamkultur. Viele Top-Kanzleien bieten genau das — schauen Sie mal rein!";
                      badges = [
                        { icon: "🏠", label: "Homeoffice" },
                        { icon: "📚", label: "Weiterbildung" },
                        { icon: "⏰", label: "Flexible Zeiten" },
                        { icon: "💰", label: "Mehr Gehalt" },
                      ];
                    } else {
                      emoji = "🏆";
                      titel = "Sie gehören zu den Top-Verdienern!";
                      text = "Ihr Gehalt ist überdurchschnittlich — aber stimmen auch Entwicklungsmöglichkeiten, Flexibilität und Teamkultur bei Ihrem Arbeitgeber? Die besten Kanzleien bieten mehr als nur gutes Gehalt.";
                      badges = [
                        { icon: "🚀", label: "Karriere" },
                        { icon: "🏠", label: "Homeoffice" },
                        { icon: "⭐", label: "Teamkultur" },
                        { icon: "📚", label: "Weiterbildung" },
                      ];
                    }

                    return (
                      <div className="mt-6 space-y-4">
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/80 p-5 text-white">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
                          <div className="relative z-10">
                            <div className="text-center mb-4">
                              <div className="text-4xl mb-2">{emoji}</div>
                              <p className="text-xl font-bold mb-1">{titel}</p>
                              <p className="text-white/80 text-sm">{text}</p>
                              {badges && (
                                <div className="flex flex-wrap gap-2 justify-center mt-2">
                                  {badges.map((b) => (
                                    <span key={b.label} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                      {b.icon} {b.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="bg-white/20 rounded-lg px-4 py-2 text-center text-sm font-medium">
                              🔥 Aktuell haben wir <span className="font-bold text-yellow-300">{jobCount} offene Stellen</span> die zu Ihrem Profil passen!
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            className="bg-primary text-white font-bold h-11"
                            onClick={() => {
                              onOpenChange(false);
                              setTimeout(() => {
                                document.getElementById('stellenangebote')
                                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 300);
                            }}
                          >
                            🔍 Passende Stellen ansehen
                          </Button>
                          <Button
                            variant="outline"
                            className="h-11 font-medium border-2"
                            onClick={() => { handleOpenChange(false); setApplyOpen(true); }}
                          >
                            ⚡ Jetzt initiativ bewerben
                          </Button>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                          Kostenlos · Kein Lebenslauf nötig · In 30 Sekunden bewerben
                        </p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="mt-6 p-6 rounded-xl bg-secondary/50 text-center text-sm text-muted-foreground">
                  Für diese Kombination liegen uns noch keine Gehaltsdaten vor.
                  <br />
                  Unsere Berater helfen Ihnen gerne persönlich weiter.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <InitiativeApplyModal open={applyOpen} onOpenChange={setApplyOpen} />
    </>
  );
};

export default GehaltsCheckModal;
