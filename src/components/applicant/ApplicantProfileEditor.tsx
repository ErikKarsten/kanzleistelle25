import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { calculateProfileCompletion } from "@/lib/profileCompletion";
import { buildSafeDocumentName, handleDownload, normalizeStoragePath } from "@/lib/documentAccess";
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
  const [activeDownloadKey, setActiveDownloadKey] = useState<string | null>(null);
  const [activeDownloadLabel, setActiveDownloadLabel] = useState("");

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
      const updatePayload: Record<string, any> = {
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        email: data.email || null,
        phone: data.phone || null,
        earliest_start_date: data.earliest_start_date || null,
        salary_expectation: data.salary_expectation || null,
        notice_period: data.notice_period || null,
        special_skills: data.special_skills || null,
        updated_at: new Date().toISOString(),
        applicant_updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("applications")
        .update(updatePayload)
        .eq("id", application.id);

      if (error) {
        console.error("[profile-save] Supabase error:", JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applicant-applications"] });
      toast.success("Profil gespeichert");

      // Send confirmation email via Brevo
      if (variables.email) {
        try {
          const displayName = [variables.first_name, variables.last_name].filter(Boolean).join(" ") || "Bewerber/in";
          const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background:#1a365d;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:22px;">Kanzleistellen24</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;font-size:16px;color:#1a202c;">Hallo ${displayName},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#4a5568;line-height:1.6;">
      dein Bewerberprofil wurde erfolgreich aktualisiert. Arbeitgeber können nun deine aktuellen Angaben einsehen.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
      Je vollständiger dein Profil ist, desto besser stehen deine Chancen auf eine Einladung zum Gespräch.
    </p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#1a365d;border-radius:6px;padding:12px 24px;">
      <a href="https://kanzleistelle25.lovable.app/bewerber" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">Zum Dashboard →</a>
    </td></tr></table>
    <p style="margin:24px 0 0;font-size:13px;color:#a0aec0;">Diese E-Mail wurde automatisch versendet. Bitte antworte nicht darauf.</p>
  </td></tr>
  <tr><td style="background:#f7fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:12px;color:#a0aec0;">© ${new Date().getFullYear()} Kanzleistellen24 · Alle Rechte vorbehalten</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

          const { error: emailError } = await supabase.functions.invoke("send-contact-email", {
            body: {
              to_email: variables.email,
              to_name: displayName,
              subject: "Deine Bewerbung bei Kanzleistellen24 – Profil aktualisiert",
              html,
            },
          });

          if (emailError) {
            console.warn("[profile-save] Email notification failed:", emailError);
            toast.info("E-Mail-Bestätigung konnte nicht gesendet werden, Profil wurde aber gespeichert.");
          }
        } catch (emailErr) {
          console.warn("[profile-save] Email send error:", emailErr);
        }
      }
    },
    onError: (error: any) => {
      console.error("[profile-save] Full error:", error);
      const detail = error?.message || error?.details || "Unbekannter Fehler";
      toast.error(`Fehler beim Speichern: ${detail}`);
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
          applicant_updated_at: new Date().toISOString(),
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
    const currentPath = application?.[urlKey] as string | null;

    try {
      if (currentPath) {
        const { path: normalizedPath } = normalizeStoragePath(currentPath);
        if (normalizedPath) {
          const deleteTargets = normalizedPath.startsWith("applications/")
            ? [
                { bucket: "resumes" as const, path: normalizedPath },
                { bucket: "applications" as const, path: normalizedPath.replace(/^applications\//, "") },
              ]
            : [{ bucket: "applications" as const, path: normalizedPath }];

          for (const target of deleteTargets) {
            if (!target.path) continue;
            const { error: removeError } = await supabase.storage.from(target.bucket).remove([target.path]);
            if (removeError) {
              console.error("[document-delete] remove failed", target, removeError);
            }
          }
        }
      }

      const { error } = await supabase
        .from("applications")
        .update({ [columnMap[type]]: null, updated_at: new Date().toISOString() } as any)
        .eq("id", application.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["applicant-applications"] });
      toast.success("Datei entfernt");
    } catch (error) {
      console.error("[document-delete] failed", error);
      toast.error("Dokument konnte nicht vom Server abgerufen werden.");
    }
  }, [application, queryClient]);

  const getDocumentName = useCallback((path: string, label: string) => {
    return buildSafeDocumentName({
      label,
      firstName: formData.first_name || application?.first_name,
      lastName: formData.last_name || application?.last_name,
      rawPath: path,
    });
  }, [formData.first_name, formData.last_name, application?.first_name, application?.last_name]);

  const handleDownloadFile = useCallback(async (path: string, label: string) => {
    const actionKey = `download:${path}`;
    setActiveDownloadKey(actionKey);
    setActiveDownloadLabel(label);

    try {
      const success = await handleDownload(path, getDocumentName(path, label));
      if (!success) {
        toast.error("Dokument konnte nicht vom Server abgerufen werden.");
      }
    } catch (error) {
      console.error("[document-download] failed", { path, error });
      toast.error("Download blockiert? Bitte prüfe deine Browser-Erweiterungen oder Ad-Blocker.");
    } finally {
      setActiveDownloadKey(null);
      setActiveDownloadLabel("");
    }
  }, [getDocumentName]);

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
                title="Herunterladen"
                onClick={() => handleDownloadFile(currentUrl, label)}
                disabled={activeDownloadKey !== null}
              >
                <Download className="h-4 w-4 text-primary" />
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

      {activeDownloadKey && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Dokument wird sicher heruntergeladen: <span className="font-medium text-foreground">{activeDownloadLabel}</span>
            </p>
            <Progress value={70} className="h-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApplicantProfileEditor;
