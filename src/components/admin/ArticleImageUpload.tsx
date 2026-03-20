import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CloudUpload, Loader2, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

interface ArticleImageUploadProps {
  currentImageUrl: string;
  onUploadComplete: (url: string) => void;
}

const ArticleImageUpload = ({ currentImageUrl, onUploadComplete }: ArticleImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(currentImageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    setPreview(currentImageUrl || "");
  }, [currentImageUrl]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Nur JPG, PNG und WebP Dateien sind erlaubt.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Die Datei darf maximal 2 MB groß sein.";
    }
    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(fileName, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("article-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setPreview(publicUrl);
      onUploadComplete(publicUrl);
      toast.success("Bild hochgeladen!");
    } catch (err: any) {
      toast.error("Upload fehlgeschlagen: " + err.message);
      setPreview(currentImageUrl || "");
    } finally {
      setIsUploading(false);
    }
  }, [currentImageUrl, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = () => {
    setPreview("");
    onUploadComplete("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>Artikelbild</Label>

      {preview ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={preview}
              alt="Artikelbild Vorschau"
              className="w-full h-48 object-cover"
              loading="lazy"
              decoding="async"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Ändern
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
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
              {isUploading ? "Wird hochgeladen..." : "Bild hochladen oder hierher ziehen"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG oder WebP · max. 2 MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
};

export default ArticleImageUpload;
