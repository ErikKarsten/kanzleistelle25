import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Upload, 
  FileText, 
  Loader2, 
  X,
  Sparkles
} from "lucide-react";

interface ApplySuccessStepProps {
  firstName: string;
  applicationId: string;
  company: string;
  onClose: () => void;
}

const ApplySuccessStep = ({
  firstName,
  applicationId,
  company,
  onClose,
}: ApplySuccessStepProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: "Ungültiges Format",
        description: "Bitte laden Sie nur PDF-Dateien hoch.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Die Datei darf maximal 5MB groß sein.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${applicationId}_${Date.now()}.${fileExt}`;
      const filePath = `applications/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store the file path (not public URL) since bucket is now private
      // Admins will generate signed URLs when viewing resumes
      const { error: updateError } = await supabase
        .from("applications")
        .update({ resume_url: filePath })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      setUploadedFile(file.name);
      toast({
        title: "Lebenslauf hochgeladen! 🎉",
        description: "Deine Bewerbung ist jetzt komplett.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          Vielen Dank, {firstName}!
        </h3>
        <p className="text-muted-foreground">
          Deine Daten wurden sicher an <span className="font-medium text-foreground">{company}</span> übermittelt.
        </p>
      </div>

      {/* Chancen-Boost Box */}
      <div className="bg-gradient-to-br from-[hsl(45,90%,50%)]/10 to-[hsl(45,90%,50%)]/5 border-2 border-[hsl(45,90%,50%)]/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-[hsl(45,90%,50%)]" />
          <h4 className="font-bold text-foreground">Chancen-Boost (Optional)</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Kanzleien bevorzugen Bewerbungen mit Lebenslauf. Erhöhe deine Chancen auf eine Rückmeldung und lade dein PDF hier kurz hoch.
        </p>

        {uploadedFile ? (
          <div className="flex items-center gap-3 bg-background rounded-lg p-3 border">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground truncate">{uploadedFile}</p>
              <p className="text-xs text-green-600">Erfolgreich hochgeladen</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full h-24 border-dashed border-2 hover:border-[hsl(45,90%,50%)] hover:bg-[hsl(45,90%,50%)]/5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm">Wird hochgeladen...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    PDF hochladen (max. 5MB)
                  </span>
                </div>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Close Button */}
      <Button
        onClick={onClose}
        className="w-full"
        size="lg"
        variant={uploadedFile ? "default" : "outline"}
      >
        {uploadedFile ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Fertig
          </>
        ) : (
          <>
            <X className="h-4 w-4 mr-2" />
            Fenster schließen
          </>
        )}
      </Button>
    </div>
  );
};

export default ApplySuccessStep;
