import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Bell, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface CriticalApp {
  id: string;
  first_name: string | null;
  last_name: string | null;
  updated_at: string | null;
  status: string | null;
  company_id: string | null;
  companyName: string;
  jobTitle: string;
  daysWaiting: number;
  ampel: "yellow" | "red";
}

interface Company {
  id: string;
  name: string;
  user_id: string | null;
}

interface CriticalApplicationsMonitorProps {
  applications: any[] | undefined;
  companies: Company[] | undefined;
}

function getAmpelData(updatedAt: string | null): { ampel: "green" | "yellow" | "red"; days: number } {
  if (!updatedAt) return { ampel: "red", days: 999 };
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 3) return { ampel: "green", days };
  if (days <= 7) return { ampel: "yellow", days };
  return { ampel: "red", days };
}

const CriticalApplicationsMonitor = ({
  applications,
  companies,
}: CriticalApplicationsMonitorProps) => {
  const [companyFilter, setCompanyFilter] = useState("all");

  // Build company lookup
  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies?.forEach((c) => map.set(c.id, c));
    return map;
  }, [companies]);

  // Critical applications (yellow + red only, non-archived, pending/reviewing)
  const criticalApps = useMemo(() => {
    if (!applications) return [];

    return applications
      .filter((a) => !a.is_archived && ["pending", "reviewing"].includes(a.status || ""))
      .map((a): CriticalApp | null => {
        const { ampel, days } = getAmpelData(a.updated_at);
        if (ampel === "green") return null;

        const companyId = a.company_id || a.jobs?.company_id;
        const company = companyId ? companyMap.get(companyId) : null;

        return {
          id: a.id,
          first_name: a.first_name,
          last_name: a.last_name,
          updated_at: a.updated_at,
          status: a.status,
          company_id: companyId,
          companyName: company?.name || a.jobs?.company || "Unbekannt",
          jobTitle: a.jobs?.title || "Unbekannte Stelle",
          daysWaiting: days,
          ampel: ampel as "yellow" | "red",
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.daysWaiting - a!.daysWaiting) as CriticalApp[];
  }, [applications, companyMap]);

  // Filter by company
  const filteredApps = useMemo(() => {
    if (companyFilter === "all") return criticalApps;
    return criticalApps.filter((a) => a.company_id === companyFilter);
  }, [criticalApps, companyFilter]);

  // Unique companies in critical list for filter
  const criticalCompanies = useMemo(() => {
    const seen = new Map<string, string>();
    criticalApps.forEach((a) => {
      if (a.company_id && !seen.has(a.company_id)) {
        seen.set(a.company_id, a.companyName);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [criticalApps]);

  // Stats
  const totalActive = applications?.filter((a) => !a.is_archived).length || 0;
  const redCount = criticalApps.filter((a) => a.ampel === "red").length;

  const avgReactionTime = useMemo(() => {
    if (!applications) return 0;
    const activeApps = applications.filter(
      (a) => !a.is_archived && a.status && a.status !== "pending" && a.created_at && a.updated_at
    );
    if (activeApps.length === 0) return 0;
    const totalDays = activeApps.reduce((sum, a) => {
      const created = new Date(a.created_at).getTime();
      const updated = new Date(a.updated_at).getTime();
      return sum + Math.max(0, (updated - created) / (1000 * 60 * 60 * 24));
    }, 0);
    return Math.round((totalDays / activeApps.length) * 10) / 10;
  }, [applications]);

  // Nudge mutation - send reminder to specific company
  const nudgeMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const company = companyMap.get(companyId);
      if (!company) throw new Error("Kanzlei nicht gefunden");

      // Get employer email
      let employerEmail: string | null = null;
      if (company.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", company.user_id)
          .single();
        employerEmail = profile?.email || null;
      }

      // Build applicant list for this company
      const companyApps = criticalApps.filter((a) => a.company_id === companyId);
      const applicants = companyApps.map((a) => ({
        name: `${a.first_name || ""} ${a.last_name || ""}`.trim() || "Unbekannt",
        jobTitle: a.jobTitle,
        daysWaiting: a.daysWaiting,
      }));

      // Use the email template from lib
      const { buildApplicantReminderEmail } = await import("@/lib/emailTemplates");
      const email = buildApplicantReminderEmail({
        companyName: company.name,
        applicants,
      });

      // Send via edge function
      const recipients = [employerEmail, "info@kanzleistelle24.de"].filter(Boolean);
      const uniqueRecipients = [...new Set(recipients)];

      for (const toEmail of uniqueRecipients) {
        const { error } = await supabase.functions.invoke("send-contact-email", {
          body: {
            to_email: toEmail,
            to_name: company.name,
            subject: email.subject,
            html: email.html,
          },
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Erinnerungsmail wurde versendet!");
    },
    onError: (error: any) => {
      toast.error("Fehler beim Versenden", { description: error.message });
    },
  });

  if (criticalApps.length === 0 && totalActive === 0) return null;

  return (
    <div className="space-y-6">
      {/* Stat Widgets */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bewerbungen</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalActive}</p>
                <p className="text-xs text-muted-foreground mt-1">Aktive Bewerbungen</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-md ${redCount > 0 ? "ring-1 ring-red-300" : ""}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kritisch (Rot)</p>
                <p className="text-3xl font-bold text-foreground mt-1">{redCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Keine Aktivität seit &gt; 7 Tagen</p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${redCount > 0 ? "bg-red-100" : "bg-muted"}`}>
                <AlertTriangle className={`h-6 w-6 ${redCount > 0 ? "text-red-600" : "text-muted-foreground"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ø Reaktionszeit</p>
                <p className="text-3xl font-bold text-foreground mt-1">{avgReactionTime}</p>
                <p className="text-xs text-muted-foreground mt-1">Tage bis zur ersten Aktion</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl">⏱️</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Applications Table */}
      {criticalApps.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Kritische Bewerbungen
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {criticalApps.length} wartend
                </Badge>
              </div>

              {/* Company filter */}
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Kanzlei filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kanzleien</SelectItem>
                  {criticalCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bewerber</TableHead>
                    <TableHead>Kanzlei</TableHead>
                    <TableHead>Stelle</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Tage</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.first_name} {app.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {app.companyName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {app.jobTitle}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            app.ampel === "red"
                              ? "bg-red-500 animate-pulse"
                              : "bg-yellow-400"
                          }`}
                          title={app.ampel === "red" ? `Kritisch: ${app.daysWaiting} Tage` : `Warnung: ${app.daysWaiting} Tage`}
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {app.daysWaiting}
                      </TableCell>
                      <TableCell className="text-right">
                        {app.company_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            disabled={nudgeMutation.isPending}
                            onClick={() => nudgeMutation.mutate(app.company_id!)}
                          >
                            {nudgeMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Bell className="h-3 w-3 mr-1" />
                            )}
                            Erinnern
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CriticalApplicationsMonitor;
