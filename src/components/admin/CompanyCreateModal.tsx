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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LogoUpload from "@/components/employer/LogoUpload";

interface CompanyCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CompanyCreateModal = ({ open, onOpenChange }: CompanyCreateModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    logo_url: "",
    website: "",
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.name.trim()) throw new Error("Name ist erforderlich");

      const insertData: { name: string; location?: string; description?: string; logo_url?: string; website?: string } = { name: data.name.trim() };
      if (data.location.trim()) insertData.location = data.location.trim();
      if (data.description.trim()) insertData.description = data.description.trim();
      if (data.logo_url.trim()) insertData.logo_url = data.logo_url.trim();
      if (data.website.trim()) insertData.website = data.website.trim();

      console.log("Inserting company with data:", insertData);
      const { error } = await supabase.from("companies").insert(insertData);

      if (error) {
        console.error("Company create error:", JSON.stringify(error, null, 2));
        throw new Error(`${error.message} (Code: ${error.code}, Details: ${error.details}, Hint: ${error.hint})`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies-list"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Kanzlei erfolgreich erstellt", {
        description: `"${formData.name}" wurde angelegt.`,
      });
      setFormData({ name: "", location: "", description: "", logo_url: "", website: "" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Fehler beim Erstellen", {
        description: error.message || "Bitte versuchen Sie es erneut.",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Neue Kanzlei erstellen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <LogoUpload
            currentLogoUrl={formData.logo_url || null}
            companyName={formData.name}
            onUploadComplete={(url) =>
              setFormData({ ...formData, logo_url: url })
            }
          />

          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Kanzleiname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-location">Standort</Label>
            <Input
              id="create-location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="z.B. Berlin, Hamburg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-website">Website</Label>
            <Input
              id="create-website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.kanzlei-beispiel.de"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-description">Beschreibung</Label>
            <Textarea
              id="create-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kurze Beschreibung der Kanzlei..."
              rows={3}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyCreateModal;
