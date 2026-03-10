import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  User,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Paperclip,
  Trash2,
  CalendarDays,
  DollarSign,
  Clock,
  Sparkles,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { calculateProfileCompletion } from "@/lib/profileCompletion";
import { cn } from "@/lib/utils";

interface ApplicantProfileEditorProps {
  application: any;
  userId: string;
}

const PROFILE_FIELDS = [
  { key: "first_name", label: "Vorname" },
  { key: "last_name", label: "Nachname" },
  { key: "email", label: "E-Mail" },
  { key: "phone", label: "Telefon" },
  { key: "earliest_start_date", label: "Eintrittsdatum" },
  { key: "salary_expectation", label: "Gehaltsvorstellung" },
  { key: "notice_period", label: "Kündigungsfrist" },
  { key: "special_skills", label: "Fachkenntnisse" },
  { key: "resume_url", label: "Lebenslauf" },
] as const;

const ApplicantProfileEditor = ({ application, userId }: ApplicantProfileEditorProps) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    earliest_start_date: "",
    salary_expectation: "",
    notice_period: "",
    special_skills: "",
  });

  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (application) {
      setFormData({
        first_name: application.first_name || "",
        last_name: application.last_name || "",
        email: application.email || "",
        phone: application.phone || "",
        earliest_start_date: application.earliest_start_date || "",
        salary_expectation: application.salary_expectation || "",
        notice_period: application.notice_period || "",
        special_skills: application.special_skills || "",
      });
    }
  }, [application?.id]);

  // Calculate profile completion using shared weighted logic with live form data
  const completion = useMemo(() => {
    const liveApp = {
      ...application,
      ...formData,
    };
    return calculateProfileCompletion(liveApp);
  }, [formData, application]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("applications")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", application.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicant-applications"] });
      toast.success("Profil gespeichert");
      // Notify employer via realtime (the update triggers postgres_changes)
    },
    onError: () => {
      toast.error("Fehler beim Speichern");
    },
  });

  const handleFileUpload = useCallback(async (file: File, type: "resume" | "certificates" | "cover_letter") => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Datei ist zu groß (max. 5 MB)");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Nur PDF-Dateien erlaubt");
      return;
    }

    setUploading(type);
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${application.id}/${type}_${Date.now()}_${cleanName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("applications")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const columnMap: Record<string, string> = {
        resume: "resume_url",
        certificates: "certificates_url",
        cover_letter: "cover_letter_url",
      };

      const { error: updateError } = await supabase
        .from("applications")
        .update({
          [columnMap[type]]: path,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", application.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["applicant-applications"] });
      toast.success(`${type === "resume" ? "Lebenslauf" : type === "certificates" ? "Zeugnisse" : "Anschreiben"} hochgeladen`);
    } catch (err: any) {
      toast.error(err.message || "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  }, [application?.id, queryClient]);

  const handleDeleteFile = useCallback(async (type: "resume" | "certificates" | "cover_letter") => {
    const columnMap: Record<string, string> = {
      resume: "resume_url",
      certificates: "certificates_url",
      cover_letter: "cover_letter_url",
    };
    const urlKey = columnMap[type] as keyof typeof application;
    const currentPath = application?.[urlKey];

    try {
      if (currentPath) {
        const bucket = currentPath.startsWith("applications/") ? "resumes" : "applications";
        await supabase.storage.from(bucket).remove([currentPath]);
      }
      const { error } = await supabase
        .from("applications")
        .update({ [columnMap[type]]: null, updated_at: new Date().toISOString() } as any)
        .eq("id", application.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["applicant-applications"] });
      toast.success("Datei entfernt");
    } catch {
      toast.error("Fehler beim Entfernen");
    }
  }, [application?.id, queryClient]);

  const openFile = useCallback(async (path: string) => {
    try {
      // Determine correct bucket based on legacy path prefix
      const isLegacy = path.startsWith("applications/");
      const bucket = isLegacy ? "resumes" : "applications";
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error || !data) {
        toast.error("Datei konnte nicht geladen werden. Bitte deaktiviere deinen Ad-Blocker, falls der Download nicht startet.");
        return;
      }
      const url = URL.createObjectURL(data);
      window.open(url, "_blank");
    } catch {
      toast.error("Datei konnte nicht geladen werden. Bitte deaktiviere deinen Ad-Blocker, falls der Download nicht startet.");
    }
  }, []);

  const FileUploadSlot = ({ type, label, icon: Icon, currentUrl }: { type: "resume" | "certificates" | "cover_letter"; label: string; icon: any; currentUrl: string | null }) => {
    // Extract readable filename from storage path
    const fileName = currentUrl
      ? currentUrl.split("/").pop()?.replace(/^(resume|certificates|cover_letter)_\d+_/, "") || "Dokument"
      : null;

    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            currentUrl ? "bg-primary/10" : "bg-muted"
          )}>
            <Icon className={cn("h-4 w-4", currentUrl ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{label}</p>
            {currentUrl ? (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={fileName || ""}>
                📄 {fileName}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Noch nicht hochgeladen</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {currentUrl && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Ansehen"
                onClick={() => openFile(currentUrl)}
              >
                <Eye className="h-4 w-4 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Löschen"
                onClick={() => handleDeleteFile(type)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f, type);
                e.target.value = "";
              }}
            />
            <div className="inline-flex items-center justify-center h-8 px-3 rounded-md border bg-background text-sm font-medium hover:bg-accent transition-colors">
              {uploading === type ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
              {currentUrl ? "Ersetzen" : "Hochladen"}
            </div>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Profil-Vollständigkeit</h3>
            </div>
            <Badge variant={completion.percentage === 100 ? "default" : "secondary"} className={completion.percentage === 100 ? "bg-green-100 text-green-700 border-green-200" : ""}>
              {completion.percentage}%
            </Badge>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden mb-3">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                completion.percentage < 40 ? "bg-orange-500" : completion.percentage < 70 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
          {completion.missing.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {completion.missing.map((field) => (
                <Badge key={field.key} variant="outline" className="text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {field.label}
                </Badge>
              ))}
            </div>
          )}
          {completion.percentage === 100 && (
            <p className="text-sm flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Dein Profil ist vollständig – du hebst dich positiv ab!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Personal Data Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Persönliche Daten
          </CardTitle>
          <CardDescription>Bearbeite deine Kontaktdaten für diese Bewerbung.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Vorname</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Nachname</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job-Specific Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Job-spezifische Angaben
          </CardTitle>
          <CardDescription>Ergänze diese Infos, um deine Chancen zu verbessern.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="earliest_start_date" className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Frühestmögliches Eintrittsdatum
              </Label>
              <Input
                id="earliest_start_date"
                type="date"
                value={formData.earliest_start_date}
                onChange={(e) => setFormData((p) => ({ ...p, earliest_start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salary_expectation" className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Gehaltsvorstellung
              </Label>
              <Input
                id="salary_expectation"
                placeholder="z.B. 45.000 – 50.000 € brutto/Jahr"
                value={formData.salary_expectation}
                onChange={(e) => setFormData((p) => ({ ...p, salary_expectation: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice_period" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Kündigungsfrist
              </Label>
              <Input
                id="notice_period"
                placeholder="z.B. 3 Monate zum Quartalsende"
                value={formData.notice_period}
                onChange={(e) => setFormData((p) => ({ ...p, notice_period: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="special_skills" className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              Besondere Fachkenntnisse
            </Label>
            <Textarea
              id="special_skills"
              placeholder="z.B. DATEV, Lexware, Addison, ELSTER, SAP, Lohn- & Gehaltsabrechnung ..."
              value={formData.special_skills}
              onChange={(e) => setFormData((p) => ({ ...p, special_skills: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Deine Unterlagen
          </CardTitle>
          <CardDescription>Lade deine Dokumente hoch oder ersetze vorhandene (PDF, max. 5 MB).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FileUploadSlot type="resume" label="Lebenslauf" icon={FileText} currentUrl={application?.resume_url} />
          <FileUploadSlot type="certificates" label="Zeugnisse / Zertifikate" icon={Paperclip} currentUrl={application?.certificates_url} />
          <FileUploadSlot type="cover_letter" label="Anschreiben / Motivationsschreiben" icon={FileText} currentUrl={application?.cover_letter_url} />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Profil speichern
        </Button>
      </div>
    </div>
  );
};

export default ApplicantProfileEditor;
