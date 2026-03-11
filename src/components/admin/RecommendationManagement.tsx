import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles, Plus, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: "Offen", className: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: Clock },
  confirmed: { label: "Bestätigt", className: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle },
  rejected: { label: "Abgelehnt", className: "bg-red-100 text-red-700 border-red-300", icon: XCircle },
};

const RecommendationManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("none");
  const [adminNote, setAdminNote] = useState("");

  // Fetch recommendations
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["admin-recommendations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch applicants (users with candidate role who have profiles)
  const { data: applicants } = useQuery({
    queryKey: ["admin-applicant-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ["admin-recommendation-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, user_id")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch jobs for selected company
  const { data: companyJobs } = useQuery({
    queryKey: ["admin-recommendation-jobs", selectedCompanyId],
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
    enabled: !!selectedCompanyId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const applicant = applicants?.find((a) => a.id === selectedApplicantId);
      const company = companies?.find((c) => c.id === selectedCompanyId);
      const job = companyJobs?.find((j) => j.id === selectedJobId);

      const { error } = await supabase.from("recommendations").insert({
        admin_id: user!.id,
        applicant_user_id: selectedApplicantId,
        company_id: selectedCompanyId,
        job_id: selectedJobId !== "none" ? selectedJobId : null,
        admin_note: adminNote || null,
        applicant_name: applicant?.full_name || applicant?.email || "Unbekannt",
        company_name: company?.name || "Unbekannt",
        job_title: job?.title || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recommendations"] });
      toast.success("Vorschlag erstellt – Bewerber wird benachrichtigt");
      resetForm();
    },
    onError: () => toast.error("Fehler beim Erstellen des Vorschlags"),
  });

  const resetForm = () => {
    setCreateOpen(false);
    setSelectedApplicantId("");
    setSelectedCompanyId("");
    setSelectedJobId("none");
    setAdminNote("");
  };

  const stats = useMemo(() => {
    if (!recommendations) return { pending: 0, confirmed: 0, rejected: 0 };
    return {
      pending: recommendations.filter((r) => r.status === "pending").length,
      confirmed: recommendations.filter((r) => r.status === "confirmed").length,
      rejected: recommendations.filter((r) => r.status === "rejected").length,
    };
  }, [recommendations]);

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Matching & Vorschläge</CardTitle>
            {stats.pending > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                {stats.pending} offen
              </Badge>
            )}
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Vorschlag erstellen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats row */}
        <div className="flex gap-4 mb-6">
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const count = stats[key as keyof typeof stats];
            return (
              <div key={key} className="flex items-center gap-1.5 text-sm">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{count}</span>
                <span className="text-muted-foreground">{cfg.label}</span>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bewerber</TableHead>
                  <TableHead>Kanzlei</TableHead>
                  <TableHead>Stelle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead>Bestätigt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((rec) => {
                  const cfg = statusConfig[rec.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">{rec.applicant_name || "—"}</TableCell>
                      <TableCell>{rec.company_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rec.job_title || <span className="italic">Allgemein</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.className}>
                          <Icon className="h-3 w-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rec.created_at && format(new Date(rec.created_at), "dd.MM.yy", { locale: de })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rec.confirmed_at
                          ? format(new Date(rec.confirmed_at), "dd.MM.yy", { locale: de })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Noch keine Vorschläge erstellt. Klicken Sie auf "Vorschlag erstellen", um einen Bewerber einer Kanzlei zu empfehlen.
          </p>
        )}

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={(o) => { if (!o) resetForm(); else setCreateOpen(true); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Neuen Vorschlag erstellen</DialogTitle>
              <DialogDescription>
                Wählen Sie einen Bewerber und eine Kanzlei aus. Optional können Sie eine konkrete Stelle zuweisen.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Applicant */}
              <div className="space-y-1.5">
                <Label>Bewerber</Label>
                <Select value={selectedApplicantId} onValueChange={setSelectedApplicantId}>
                  <SelectTrigger><SelectValue placeholder="Bewerber auswählen..." /></SelectTrigger>
                  <SelectContent>
                    {applicants?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.full_name || a.email || a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Company */}
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

              {/* Job (optional) */}
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

              {/* Admin note */}
              <div className="space-y-1.5">
                <Label>Notiz für den Bewerber (optional)</Label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Z.B.: Diese Kanzlei sucht genau dein Profil..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!selectedApplicantId || !selectedCompanyId || createMutation.isPending}
              >
                {createMutation.isPending ? "Wird erstellt..." : "Vorschlag erstellen"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RecommendationManagement;
