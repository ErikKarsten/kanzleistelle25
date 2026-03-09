import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Upload,
  FileText,
  Loader2,
  Rocket,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import ApplyAccountCreation from "./ApplyAccountCreation";

interface ApplySuccessStepProps {
  firstName: string;
  email: string;
  applicationId: string | null;
  company: string;
  onClose: () => void;
}

const ApplySuccessStep = ({
  firstName,
  email,
  applicationId,
  company,
  onClose,
}: ApplySuccessStepProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🎉 Confetti on mount
  useEffect(() => {
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const celebrateUpload = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const sanitizeFileName = (name: string): string => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .toLowerCase();
  };

  const processFile = async (file: File) => {
    if (!applicationId) {
      toast({ title: "Upload nicht möglich", description: "Bewerbungs-ID fehlt.", variant: "destructive" });
      return;
    }
    if (file.type !== "application/pdf") {
      toast({ title: "Ungültiges Format", description: "Bitte nur PDF-Dateien hochladen.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Maximal 5 MB erlaubt.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 12, 90));
    }, 200);

    try {
      const sanitized = sanitizeFileName(file.name.replace(/\.pdf$/i, ""));
      const fileName = `${applicationId}_${Date.now()}_${sanitized}.pdf`;
      const filePath = `applications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("applications")
        .update({ resume_url: filePath })
        .eq("id", applicationId);
      if (updateError) throw updateError;

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadedFile(file.name);
      celebrateUpload();
      toast({ title: "Lebenslauf hochgeladen! 🎉", description: "Deine Bewerbung ist jetzt komplett." });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload fehlgeschlagen", description: "Bitte versuche es erneut.", variant: "destructive" });
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [applicationId]);

  const canUpload = !!applicationId;
  const showUploadArea = canUpload && !uploadedFile && !skipped && !showAccountCreation;

  // After upload or skip, show account creation
  const shouldShowAccountPrompt = (uploadedFile || skipped) && !showAccountCreation && !accountCreated;

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-1">
          Geschafft, {firstName}! 🎉
        </h3>
        <p className="text-muted-foreground">
          Deine Bewerbung ist bei <span className="font-semibold text-primary">{company}</span> eingegangen!
        </p>
      </div>

      {/* Upload Area */}
      {showUploadArea && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h4 className="font-bold text-foreground">🚀 Verdopple jetzt deine Chancen!</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Lade hier noch schnell deinen Lebenslauf (PDF) hoch – Kanzleien bevorzugen komplette Bewerbungen.
          </p>

          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />

          {isUploading ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">Wird hochgeladen…</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">PDF hierher ziehen oder klicken</p>
              <p className="text-xs text-muted-foreground mt-1">Maximal 5 MB</p>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
            <span>Dein Lebenslauf wird verschlüsselt gespeichert und gemäß DSGVO nach 6 Monaten automatisch gelöscht.</span>
          </div>
        </div>
      )}

      {/* Upload Success */}
      {uploadedFile && !showAccountCreation && (
        <div className="rounded-xl p-5 space-y-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            <h4 className="font-bold text-foreground">Perfekt! Dein Profil sticht hervor ✨</h4>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{uploadedFile}</p>
              <p className="text-xs text-green-600 font-medium">✅ Lebenslauf erfolgreich verknüpft!</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          </div>
        </div>
      )}

      {/* Account Creation Prompt */}
      {showAccountCreation && applicationId && (
        <ApplyAccountCreation
          email={email}
          firstName={firstName}
          applicationId={applicationId}
          onAccountCreated={() => setAccountCreated(true)}
          onSkip={() => {
            setShowAccountCreation(false);
            setAccountCreated(true);
          }}
        />
      )}

      {/* DSGVO note */}
      {!showAccountCreation && (
        <p className="text-xs text-center text-muted-foreground">
          🔒 Deine Daten wurden sicher übermittelt und werden gemäß DSGVO nach 6 Monaten automatisch gelöscht.
        </p>
      )}

      {/* Buttons */}
      {!showAccountCreation && (
        <div className="space-y-2">
          {accountCreated ? (
            <Button onClick={onClose} className="w-full" size="lg">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Fertig
            </Button>
          ) : shouldShowAccountPrompt ? (
            <>
              <Button
                onClick={() => setShowAccountCreation(true)}
                className="w-full font-bold text-base tracking-wide shadow-lg shadow-primary/25"
                size="lg"
              >
                ABSCHICKEN UND REGISTRIEREN FÜR UPDATES
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <button
                onClick={onClose}
                className="w-full text-sm text-muted-foreground/70 hover:text-muted-foreground py-2 transition-colors"
              >
                Einfach nur abschicken
              </button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setSkipped(true)}
                className="w-full font-bold text-base tracking-wide shadow-lg shadow-primary/25"
                size="lg"
              >
                ABSCHICKEN UND REGISTRIEREN FÜR UPDATES
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <button
                onClick={() => {
                  setSkipped(true);
                  onClose();
                }}
                className="w-full text-sm text-muted-foreground/70 hover:text-muted-foreground py-2 transition-colors"
              >
                Einfach nur abschicken
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplySuccessStep;
