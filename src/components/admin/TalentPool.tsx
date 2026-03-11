import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, UserPlus, ArrowRight, Building2, Mail, Phone, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const roleLabels: Record<string, string> = {
  steuerfachangestellte: "Steuerfachangestellte*r",
  steuerberater: "Steuerberater*in",
  bilanzbuchhalter: "Finanz-/Bilanzbuchhalter*in",
  lohnbuchhalter: "Lohnbuchhalter*in",
};

const TalentPool = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("none");
  const [adminNote, setAdminNote] = useState("");

  // Fetch initiative applications (no job_id, source: initiative)
  const { data: talents, isLoading } = useQuery({
    queryKey: ["admin-talent-pool"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .is("job_id", null)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription for new initiative applications
  useEffect(() => {
    const channel = supabase
      .channel("admin-talent-pool-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications" },
        (payload) => {
          const app = payload.new as any;
          if (!app.job_id && app.internal_notes?.includes("source: initiative")) {
            toast.info(`✨ Neue Initiativbewerbung! ${app.first_name || ""} ${app.last_name || ""} hat sich beworben.`, {
              description: "Ein Talent hat sich ohne Kanzleibezug beworben.",
              duration: 8000,
            });
            queryClient.invalidateQueries({ queryKey: ["admin-talent-pool"] });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Fetch companies for assignment
  const { data: companies } = useQuery({
    queryKey: ["admin-talentpool-companies"],
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
    queryKey: ["admin-talentpool-jobs", selectedCompanyId],
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

  // Check existing recommendations for this talent
  const { data: existingRecs } = useQuery({
    queryKey: ["admin-talent-recs", selectedTalent?.id],
    queryFn: async () => {
      if (!selectedTalent?.user_id) return [];
      const { data, error } = await supabase
        .from("recommendations")
        .select("company_id, status")
        .eq("applicant_user_id", selectedTalent.user_id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTalent?.user_id,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTalent || !user) throw new Error("Missing data");

      const company = companies?.find((c) => c.id === selectedCompanyId);
      const job = companyJobs?.find((j) => j.id === selectedJobId);
      const applicantName = [selectedTalent.first_name, selectedTalent.last_name].filter(Boolean).join(" ") || "Unbekannt";

      // Create recommendation
      const { error } = await supabase.from("recommendations").insert({
        admin_id: user.id,
        applicant_user_id: selectedTalent.user_id || selectedTalent.applicant_id,
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
      queryClient.invalidateQueries({ queryKey: ["admin-talent-pool"] });
      toast.success("Kanzlei zugewiesen – Bewerber wird gefragt, ob er vorgestellt werden möchte.");
      resetAssign();
    },
    onError: () => toast.error("Fehler bei der Zuweisung"),
  });

  const resetAssign = () => {
    setAssignOpen(false);
    setSelectedTalent(null);
    setSelectedCompanyId("");
    setSelectedJobId("none");
    setAdminNote("");
  };

  const talentCount = talents?.length ?? 0;

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Talent-Pool</CardTitle>
            {talentCount > 0 && (
              <Badge className="bg-primary/10 text-primary border-primary/20 animate-pulse">
                {talentCount} neue Talente
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Initiativbewerber ohne Kanzleibezug – hier können Sie passende Kanzleien zuweisen.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : talents && talents.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Erfahrung</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Eingegangen</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talents.map((talent) => (
                  <TableRow key={talent.id}>
                    <TableCell className="font-medium">
                      {talent.first_name} {talent.last_name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {roleLabels[talent.applicant_role || ""] || talent.applicant_role || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {talent.experience ? `${talent.experience} Jahre` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {talent.email && (
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{talent.email}</span>
                        )}
                        {talent.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{talent.phone}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {talent.created_at && format(new Date(talent.created_at), "dd.MM.yy HH:mm", { locale: de })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTalent(talent);
                          setAssignOpen(true);
                        }}
                      >
                        <Building2 className="h-3.5 w-3.5 mr-1" />
                        Kanzlei zuweisen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aktuell keine Initiativbewerbungen im Talent-Pool.
          </p>
        )}

        {/* Assignment Dialog */}
        <Dialog open={assignOpen} onOpenChange={(o) => { if (!o) resetAssign(); else setAssignOpen(true); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Kanzlei zuweisen</DialogTitle>
              <DialogDescription>
                {selectedTalent && (
                  <span>
                    Weisen Sie <strong>{selectedTalent.first_name} {selectedTalent.last_name}</strong> ({roleLabels[selectedTalent.applicant_role] || selectedTalent.applicant_role}) einer Kanzlei zu.
                  </span>
                )}
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
                  placeholder="Z.B.: Diese Kanzlei in deiner Region sucht genau dein Profil..."
                  rows={3}
                />
              </div>

              {!selectedTalent?.user_id && !selectedTalent?.applicant_id && (
                <p className="text-xs text-destructive">
                  ⚠️ Dieser Bewerber hat noch kein Konto. Der Vorschlag kann erst angezeigt werden, wenn er sich registriert.
                </p>
              )}

              <Button
                className="w-full"
                onClick={() => assignMutation.mutate()}
                disabled={!selectedCompanyId || assignMutation.isPending || (!selectedTalent?.user_id && !selectedTalent?.applicant_id)}
              >
                {assignMutation.isPending ? "Wird zugewiesen..." : "Kanzlei zuweisen & Bewerber fragen"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TalentPool;
