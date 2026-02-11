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
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { companySchema } from "@/lib/validations";

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
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const validated = companySchema.parse(data);
      
      const { error } = await supabase.from("companies").insert({
        name: validated.name,
        location: validated.location || null,
        description: validated.description || null,
        logo_url: validated.logo_url || null,
        user_id: null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast.success("Kanzlei angelegt", {
        description: `"${formData.name}" wurde erfolgreich erstellt.`,
      });
      setFormData({ name: "", location: "", description: "", logo_url: "" });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Company creation error:", error);
      toast.error("Fehler beim Erstellen", {
        description: "Bitte prüfen Sie Ihre Berechtigung.",
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Kanzleiname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-location">Standort</Label>
            <Input
              id="create-location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="z.B. Berlin, Hamburg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-logo">Logo URL</Label>
            <Input
              id="create-logo"
              value={formData.logo_url}
              onChange={(e) =>
                setFormData({ ...formData, logo_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-description">Beschreibung</Label>
            <Textarea
              id="create-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Kurze Beschreibung der Kanzlei..."
              rows={3}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyCreateModal;
