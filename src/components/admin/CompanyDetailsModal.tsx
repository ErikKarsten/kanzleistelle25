import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  MapPin,
  Briefcase,
  Trash2,
  Save,
  Plus,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import JobCreateModal from "./JobCreateModal";
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

interface Job {
  id: string;
  title: string;
  employment_type: string | null;
  is_active: boolean | null;
  location: string | null;
}

interface CompanyDetailsModalProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

const CompanyDetailsModal = ({
  company,
  open,
  onOpenChange,
  onDelete,
}: CompanyDetailsModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    logo_url: "",
    website: "",
    is_active: true,
  });
  const [jobCreateOpen, setJobCreateOpen] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
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
      // Fetch owner email from profiles
      if (company.user_id) {
        supabase
          .from("profiles")
          .select("email")
          .eq("id", company.user_id)
          .maybeSingle()
          .then(({ data }) => setOwnerEmail(data?.email || null));
      } else {
        setOwnerEmail(null);
      }
    }
  }, [company]);

  const { data: jobs } = useQuery({
    queryKey: ["company-jobs", company?.id],
    queryFn: async () => {
      if (!company) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, employment_type, is_active, location")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Job[];
    },
    enabled: !!company,
  });

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

  const openJobs = jobs?.filter((job) => job.is_active) || [];

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
          {/* Section 1: Zugangsdaten (read-only) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Zugangsdaten</h3>
            <div className="space-y-2">
              <Label>E-Mail-Adresse (Inhaber)</Label>
              <Input
                value={ownerEmail || "Kein Nutzer zugewiesen"}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <Separator />

          {/* Section 2: Kanzlei-Informationen */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Kanzlei-Informationen</h3>

            {/* Logo Upload */}
            <LogoUpload
              currentLogoUrl={formData.logo_url || null}
              companyName={formData.name}
              onUploadComplete={(url) =>
                setFormData({ ...formData, logo_url: url })
              }
            />

            <div className="space-y-2">
              <Label htmlFor="admin-company-name">Kanzleiname *</Label>
              <Input
                id="admin-company-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Muster Steuerberatung GmbH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-company-location">Standort</Label>
              <Input
                id="admin-company-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="z.B. München, Berlin, Hamburg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-company-website">Website</Label>
              <Input
                id="admin-company-website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://www.kanzlei-beispiel.de"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-company-description">Kurzbeschreibung</Label>
              <Textarea
                id="admin-company-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Erzählen Sie potenziellen Bewerbern etwas über diese Kanzlei..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Section 3: Offene Stellen */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Offene Stellen ({openJobs.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJobCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Neue Stelle
              </Button>
            </div>

            {openJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-6">
                Keine offenen Stellen für diese Kanzlei.
              </p>
            ) : (
              <div className="space-y-2 pl-6">
                {openJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.location || "Remote"}
                      </div>
                    </div>
                    <Badge variant="secondary">{job.employment_type || "—"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Section 4: Admin-Aktionen */}
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
                    onClick={() => onDelete(company.id)}
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

        {/* Job Create Modal */}
        <JobCreateModal
          open={jobCreateOpen}
          onOpenChange={setJobCreateOpen}
          preselectedCompany={company ? { id: company.id, name: company.name } : null}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CompanyDetailsModal;
