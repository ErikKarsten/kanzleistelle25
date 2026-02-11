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

      const { error } = await supabase.from("companies").insert({
        name: data.name.trim(),
        location: data.location.trim() || null,
        description: data.description.trim() || null,
        logo_url: data.logo_url.trim() || null,
        website: data.website.trim() || null,
        user_id: null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies-list"] });
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
            <Label htmlFor="create-logo">Logo URL</Label>
            <Input
              id="create-logo"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://beispiel.de/logo.png"
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
