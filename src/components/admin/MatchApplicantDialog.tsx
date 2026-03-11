import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface MatchApplicantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantUserId: string | null;
  applicantName: string;
}

const MatchApplicantDialog = ({
  open,
  onOpenChange,
  applicantUserId,
  applicantName,
}: MatchApplicantDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("none");
  const [adminNote, setAdminNote] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["match-dialog-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: companyJobs } = useQuery({
    queryKey: ["match-dialog-jobs", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("company_id", selectedCompanyId)
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompanyId && open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !applicantUserId) throw new Error("Missing data");
      const company = companies?.find((c) => c.id === selectedCompanyId);
      const job = companyJobs?.find((j) => j.id === selectedJobId);

      const { error } = await supabase.from("recommendations").insert({
        admin_id: user.id,
        applicant_user_id: applicantUserId,
        company_id: selectedCompanyId,
        job_id: selectedJobId !== "none" ? selectedJobId : null,
        admin_note: adminNote || null,
        applicant_name: applicantName,
        company_name: company?.name || "Unbekannt",
        job_title: job?.title || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recommendations"] });
      toast.success(`${applicantName} wurde der Kanzlei vorgeschlagen`);
      reset();
    },
    onError: () => toast.error("Fehler beim Erstellen des Vorschlags"),
  });

  const reset = () => {
    onOpenChange(false);
    setSelectedCompanyId("");
    setSelectedJobId("none");
    setAdminNote("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); else onOpenChange(true); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kanzlei vorschlagen</DialogTitle>
          <DialogDescription>
            Schlagen Sie <strong>{applicantName}</strong> einer weiteren Kanzlei vor. Der bestehende Bewerbungsprozess bleibt unberührt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Kanzlei</Label>
            <Select value={selectedCompanyId} onValueChange={(v) => { setSelectedCompanyId(v); setSelectedJobId("none"); }}>
              <SelectTrigger><SelectValue placeholder="Kanzlei auswählen..." /></SelectTrigger>
              <SelectContent>
                {companies?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompanyId && companyJobs && companyJobs.length > 0 && (
            <div className="space-y-1.5">
              <Label>Stelle (optional)</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Allgemeine Empfehlung</SelectItem>
                  {companyJobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Nachricht an den Bewerber (optional)</Label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Z.B.: Neele hat ein weiteres spannendes Match für dich gefunden..."
              rows={3}
            />
          </div>

          {!applicantUserId && (
            <p className="text-xs text-destructive">
              ⚠️ Dieser Bewerber hat noch kein Konto. Der Vorschlag wird sichtbar, sobald er sich registriert.
            </p>
          )}

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!selectedCompanyId || mutation.isPending || !applicantUserId}
          >
            {mutation.isPending ? "Wird erstellt..." : "Kanzlei vorschlagen"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchApplicantDialog;
