import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CloudUpload, Loader2, X, ImageIcon } from "lucide-react";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  companyName?: string;
  onUploadComplete: (url: string) => void;
  /** If true, stores file immediately to Supabase. If false, returns a local preview and file. */
  immediate?: boolean;
  /** Pass a file ref to get the file for deferred upload */
  onFileSelect?: (file: File) => void;
}

const LogoUpload = ({
  currentLogoUrl,
  companyName = "",
  onUploadComplete,
  immediate = true,
  onFileSelect,
}: LogoUploadProps) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Nur PNG und JPG Dateien sind erlaubt.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Die Datei darf maximal 2 MB groß sein.";
    }
    return null;
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("logos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        toast({ title: "Ungültige Datei", description: validationError, variant: "destructive" });
        return;
      }

      // Show local preview
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      if (!immediate) {
        onFileSelect?.(file);
        return;
      }

      setIsUploading(true);
      try {
        const publicUrl = await uploadToSupabase(file);
        setPreview(publicUrl);
        onUploadComplete(publicUrl);
        toast({ title: "Logo hochgeladen!" });
      } catch (err: any) {
        toast({ title: "Upload fehlgeschlagen", description: err.message, variant: "destructive" });
        setPreview(currentLogoUrl || null);
      } finally {
        setIsUploading(false);
      }
    },
    [immediate, onFileSelect, onUploadComplete, currentLogoUrl, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>Kanzlei-Logo (optional)</Label>

      {preview ? (
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-lg border border-border">
            <AvatarImage src={preview} alt="Logo" className="object-cover" />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg">
              {companyName.substring(0, 2).toUpperCase() || "KL"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ImageIcon className="h-4 w-4 mr-1" />}
              Ändern
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={isUploading}>
              <X className="h-4 w-4 mr-1" />
              Entfernen
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/30"
          }`}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <CloudUpload className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isUploading ? "Wird hochgeladen..." : "Logo hochladen"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG oder JPG, max. 2 MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
};

export { LogoUpload, type LogoUploadProps };
export default LogoUpload;
