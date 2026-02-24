import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  Trash2,
  Save,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import LogoUpload from "@/components/employer/LogoUpload";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  location: string | null;
  created_at: string | null;
  is_active: boolean;
  website: string | null;
  user_id: string | null;
}

interface CompanyEditModalProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

const CompanyEditModal = ({
  company,
  open,
  onOpenChange,
  onDelete,
}: CompanyEditModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    logo_url: "",
    website: "",
    is_active: true,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        location: company.location || "",
        description: company.description || "",
        logo_url: company.logo_url || "",
        website: company.website || "",
        is_active: company.is_active,
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!company) return;
      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          location: data.location || null,
          description: data.description || null,
          logo_url: data.logo_url || null,
          website: data.website || null,
          is_active: data.is_active,
        } as any)
        .eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Kanzlei aktualisiert");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Fehler beim Speichern");
    },
  });

  if (!company) return null;

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Kanzlei bearbeiten
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Logo Upload */}
          <LogoUpload
            currentLogoUrl={formData.logo_url || null}
            companyName={formData.name}
            onUploadComplete={(url) =>
              setFormData({ ...formData, logo_url: url })
            }
          />

          <div className="space-y-2">
            <Label htmlFor="edit-company-name">Kanzleiname *</Label>
            <Input
              id="edit-company-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Muster Steuerberatung GmbH"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-company-location">Standort</Label>
            <Input
              id="edit-company-location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="z.B. München, Berlin, Hamburg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-company-website">Website</Label>
            <Input
              id="edit-company-website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.kanzlei-beispiel.de"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-company-description">Kurzbeschreibung</Label>
            <Textarea
              id="edit-company-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Erzählen Sie potenziellen Bewerbern etwas über diese Kanzlei..."
              rows={3}
            />
          </div>

          <Separator />

          {/* Admin section */}
          <div className="space-y-4 bg-muted/30 rounded-xl p-4 border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Admin-Aktionen
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gesperrte Kanzleien und ihre Stellen werden nicht angezeigt.
                </p>
              </div>
              <Select
                value={formData.is_active ? "active" : "blocked"}
                onValueChange={(v) =>
                  setFormData({ ...formData, is_active: v === "active" })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">✅ Freigegeben</SelectItem>
                  <SelectItem value="blocked">🚫 Gesperrt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Kanzlei endgültig löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kanzlei löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Die Kanzlei
                    und alle zugehörigen Daten werden unwiderruflich gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete(company.id);
                      onOpenChange(false);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Endgültig löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-1" />
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Änderungen speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyEditModal;
