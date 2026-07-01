import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import ApplicationFilters from "@/components/admin/ApplicationFilters";
import ApplicationsTable from "@/components/admin/ApplicationsTable";
import ApplicationDetailsModal from "@/components/admin/ApplicationDetailsModal";
import CompanyManagement from "@/components/admin/CompanyManagement";
import JobManagement from "@/components/admin/JobManagement";
import ArticleManagement from "@/components/admin/ArticleManagement";
import LeadManagement from "@/components/admin/LeadManagement";
import RecommendationManagement from "@/components/admin/RecommendationManagement";
import TalentPool from "@/components/admin/TalentPool";
import NewLeadsModal, { useNewLeadsCount } from "@/components/admin/NewLeadsModal";
import LeadtableWidget from "@/components/admin/LeadtableWidget";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, ChevronDown,
  LayoutDashboard, Inbox, Users, Building2, Briefcase, FileText,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "uebersicht",  label: "Übersicht",       icon: LayoutDashboard },
  { id: "posteingang", label: "Posteingang",      icon: Inbox },
  { id: "bewerber",    label: "Bewerber",         icon: Users },
  { id: "kanzleien",   label: "Kanzleien",        icon: Building2 },
  { id: "stellen",     label: "Stellenanzeigen",  icon: Briefcase },
  { id: "blog",        label: "Blog",             icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

const VALID_TABS = new Set<string>(TABS.map((t) => t.id));

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ApplicationWithJob {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  applicant_role: string | null;
  experience: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  status: string | null;
  created_at: string | null;
  is_archived: boolean;
  jobs: {
    id: string;
    title: string;
    company: string;
    company_id: string | null;
    employment_type: string | null;
    location: string | null;
  } | null;
}

interface Job {
  id: string;
  title: string;
  employment_type: string | null;
  is_active: boolean | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: string;
  value: number;
  label: string;
  loading: boolean;
  accent?: boolean;
  trend?: { current: number; previous: number };
}

const KpiCard = ({ icon, value, label, loading, accent, trend }: KpiCardProps) => {
  const hasTrend = trend !== undefined;
  const trendDiff = hasTrend ? trend!.current - trend!.previous : 0;
  const trendUp = trendDiff >= 0;
  const trendPct =
    hasTrend && trend!.previous > 0
      ? Math.round((Math.abs(trendDiff) / trend!.previous) * 100)
      : null;

  return (
    <Card className="shadow-sm border border-border/60">
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-2 pt-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-7 w-12 mt-2" />
            <Skeleton className="h-3 w-24 mt-1" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <span className="text-[20px] leading-none">{icon}</span>
              {hasTrend && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${trendUp ? "text-green-600" : "text-red-500"}`}>
                  {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trendPct !== null ? `${trendPct}%` : "—"}
                </span>
              )}
            </div>
            <p className={`text-[28px] font-bold mt-2 leading-none tracking-tight ${accent && value > 0 ? "text-primary" : "text-foreground"}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{label}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Chart Tooltip
// ─────────────────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as { date: string; count: number };
  return (
    <div className="bg-background border border-border rounded px-3 py-1.5 text-xs shadow-md">
      <p className="font-medium">
        {new Date(d.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long" })}
      </p>
      <p className="text-muted-foreground mt-0.5">
        {d.count} Bewerbung{d.count !== 1 ? "en" : ""}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Accordion Section
// ─────────────────────────────────────────────────────────────────────────────

interface AccordionSectionProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection = ({ label, open, onToggle, children }: AccordionSectionProps) => (
  <div className="space-y-2">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-colors"
    >
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="pt-1">{children}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────

const AdminDashboardContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "uebersicht";
  const activeMainTab: TabId = VALID_TABS.has(rawTab) ? (rawTab as TabId) : "uebersicht";

  const handleMainTabChange = (id: TabId) => {
    setSearchParams({ tab: id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Application sub-tabs ─────────────────────────────────────────────────
  const [activeSubTab, setActiveSubTab] = useState("active");
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithJob | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Company navigation (from AdminHeader) ────────────────────────────────
  const [navigateToCompanyId, setNavigateToCompanyId] = useState<string | null>(null);
  useEffect(() => {
    if (navigateToCompanyId) handleMainTabChange("kanzleien");
  }, [navigateToCompanyId]);

  // ── Accordion state ──────────────────────────────────────────────────────
  const [sectionsOpen, setSectionsOpen] = useState({ heute: true, woche: true, plattform: true });
  const toggleSection = (key: keyof typeof sectionsOpen) =>
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── New Leads Modal ──────────────────────────────────────────────────────
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);
  const leadsModalShown = useRef(false);
  const queryClient = useQueryClient();

  const { data: newLeads } = useNewLeadsCount();
  useEffect(() => {
    if ((newLeads?.length ?? 0) > 0 && !leadsModalShown.current) {
      leadsModalShown.current = true;
      setLeadsModalOpen(true);
    }
  }, [newLeads?.length]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-new-leads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_leads" }, (payload) => {
        const lead = payload.new as { full_name?: string };
        toast.info(`Neue Kontaktanfrage von ${lead.full_name || "Unbekannt"}`, {
          description: "Posteingang wurde aktualisiert.",
          duration: 8000,
        });
        queryClient.invalidateQueries({ queryKey: ["admin-contact-leads"] });
        queryClient.invalidateQueries({ queryKey: ["admin-kpi-stats"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // ── 30-day chart ─────────────────────────────────────────────────────────
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["admin-apps-30d"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("applications")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((a) => {
        if (!a.created_at) return;
        const day = a.created_at.split("T")[0];
        counts[day] = (counts[day] || 0) + 1;
      });
      const result: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const key = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        result.push({ date: key, count: counts[key] ?? 0 });
      }
      return result;
    },
  });

  // ── KPI Stats ────────────────────────────────────────────────────────────
  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ["admin-kpi-stats"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const lastWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const [a, b, c, d, e, f, g, h, i, j] = await Promise.all([
        supabase.from("applications").select("*", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("applications").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("applications").select("*", { count: "exact", head: true }).gte("created_at", lastWeekStart).lt("created_at", weekAgo),
        supabase.from("contact_leads").select("*", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("contact_leads").select("*", { count: "exact", head: true }).eq("status", "neu"),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true).eq("status", "published"),
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("companies").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("recommendations").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      ]);
      return {
        appsToday: a.count ?? 0, appsThisWeek: b.count ?? 0, appsLastWeek: c.count ?? 0,
        leadsToday: d.count ?? 0, leadsOpen: e.count ?? 0, activeJobs: f.count ?? 0,
        totalCompanies: g.count ?? 0, newCompanies: h.count ?? 0,
        unreadMessages: i.count ?? 0, recsThisWeek: j.count ?? 0,
      };
    },
  });

  // ── Applications data ────────────────────────────────────────────────────
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["admin-dashboard-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`id, first_name, last_name, email, phone,
          applicant_role, experience, cover_letter, resume_url,
          status, created_at, updated_at, is_archived, company_id,
          jobs (id, title, company, company_id, employment_type, location)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (ApplicationWithJob & { updated_at: string | null; company_id: string | null })[];
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["admin-dashboard-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("id, title, employment_type, is_active").order("title");
      if (error) throw error;
      return data as Job[];
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["admin-dashboard-companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name, user_id").order("name");
      if (error) throw error;
      return data as { id: string; name: string; user_id: string | null }[];
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").update({ is_archived: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-dashboard-applications"] }); toast.success("Bewerbung archiviert"); setModalOpen(false); },
    onError: () => toast.error("Fehler beim Archivieren"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-dashboard-applications"] }); toast.success("Bewerbung gelöscht"); setModalOpen(false); },
    onError: () => toast.error("Fehler beim Löschen"),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").update({ is_archived: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-dashboard-applications"] }); toast.success("Bewerbung wiederhergestellt"); setModalOpen(false); },
    onError: () => toast.error("Fehler beim Wiederherstellen"),
  });

  // ── Filtered applications ─────────────────────────────────────────────────
  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    return applications.filter((app) => {
      const isArchived = app.is_archived ?? false;
      if (activeSubTab === "active" && isArchived) return false;
      if (activeSubTab === "archived" && !isArchived) return false;
      if (selectedJob !== "all" && app.jobs?.id !== selectedJob) return false;
      if (selectedType !== "all" && app.jobs?.employment_type !== selectedType) return false;
      if (selectedCompany !== "all" && app.jobs?.company_id !== selectedCompany) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = [app.first_name, app.last_name].filter(Boolean).join(" ").toLowerCase();
        if (!name.includes(q) && !(app.email || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [applications, activeSubTab, selectedJob, selectedType, selectedCompany, searchQuery]);

  const archivedCount = applications?.filter((a) => a.is_archived).length ?? 0;
  const activeCount = applications?.filter((a) => !a.is_archived).length ?? 0;
  const todayLabel = format(new Date(), "dd. MMMM yyyy", { locale: de });
  const openLeadsCount = kpi?.leadsOpen ?? 0;

  const xTickFormatter = (val: string, idx: number) =>
    idx % 5 === 0
      ? new Date(val + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
      : "";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader onNavigateToCompany={(id) => setNavigateToCompanyId(id)} />

      {/* ── Sticky Tab Navigation ──────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="container max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeMainTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleMainTabChange(id as TabId)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {id === "posteingang" && openLeadsCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                      {openLeadsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      <div className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8">

        {/* ── Übersicht ──────────────────────────────────────────────── */}
        {activeMainTab === "uebersicht" && (
          <div className="max-w-[860px] mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Übersicht</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Stand: heute, {todayLabel}</p>
            </div>

            {/* Chart */}
            <Card className="shadow-sm border border-border/60">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-base font-semibold">Bewerbungen — letzte 30 Tage</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {chartLoading ? (
                  <Skeleton className="h-[180px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={xTickFormatter}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Accordions */}
            <AccordionSection label="Heute" open={sectionsOpen.heute} onToggle={() => toggleSection("heute")}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard icon="📥" value={kpi?.appsToday ?? 0} label="Neue Bewerbungen heute" loading={kpiLoading} accent />
                <KpiCard icon="💬" value={kpi?.leadsToday ?? 0} label="Neue Kontaktanfragen heute" loading={kpiLoading} accent />
                <KpiCard icon="📋" value={kpi?.leadsOpen ?? 0} label="Offene Leads" loading={kpiLoading} />
                <KpiCard icon="📨" value={kpi?.unreadMessages ?? 0} label="Ungelesene Nachrichten" loading={kpiLoading} />
              </div>
            </AccordionSection>

            <AccordionSection label="Diese Woche" open={sectionsOpen.woche} onToggle={() => toggleSection("woche")}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <KpiCard
                  icon="👥" value={kpi?.appsThisWeek ?? 0} label="Bewerbungen diese Woche" loading={kpiLoading}
                  trend={kpi ? { current: kpi.appsThisWeek, previous: kpi.appsLastWeek } : undefined}
                />
                <KpiCard icon="🏢" value={kpi?.newCompanies ?? 0} label="Neue Kanzleien diese Woche" loading={kpiLoading} />
                <KpiCard icon="🤝" value={kpi?.recsThisWeek ?? 0} label="Neue Empfehlungen diese Woche" loading={kpiLoading} />
              </div>
            </AccordionSection>

            <AccordionSection label="Plattform" open={sectionsOpen.plattform} onToggle={() => toggleSection("plattform")}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard icon="💼" value={kpi?.activeJobs ?? 0} label="Aktive Stellenanzeigen" loading={kpiLoading} />
                <KpiCard icon="🏛️" value={kpi?.totalCompanies ?? 0} label="Kanzleien gesamt" loading={kpiLoading} />
              </div>
            </AccordionSection>
          </div>
        )}

        {/* ── Posteingang ────────────────────────────────────────────── */}
        {activeMainTab === "posteingang" && (
          <div className="space-y-8">
            <LeadManagement />
            <LeadtableWidget />
          </div>
        )}

        {/* ── Bewerber ───────────────────────────────────────────────── */}
        {activeMainTab === "bewerber" && (
          <div className="space-y-8">
            <Card className="border-none shadow-md">
              <CardContent className="pt-6 space-y-6">
                <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                  <TabsList className="grid w-full max-w-[300px] grid-cols-2">
                    <TabsTrigger value="active">Aktiv ({activeCount})</TabsTrigger>
                    <TabsTrigger value="archived">Archiviert ({archivedCount})</TabsTrigger>
                  </TabsList>
                  {(["active", "archived"] as const).map((tab) => (
                    <TabsContent key={tab} value={tab} className="space-y-6 mt-6">
                      {jobs && (
                        <ApplicationFilters
                          jobs={jobs}
                          companies={companies}
                          selectedJob={selectedJob}
                          selectedType={selectedType}
                          selectedCompany={selectedCompany}
                          searchQuery={searchQuery}
                          onJobChange={setSelectedJob}
                          onTypeChange={setSelectedType}
                          onCompanyChange={setSelectedCompany}
                          onSearchChange={setSearchQuery}
                          onReset={() => { setSelectedJob("all"); setSelectedType("all"); setSelectedCompany("all"); setSearchQuery(""); }}
                        />
                      )}
                      {applicationsLoading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                      ) : (
                        <ApplicationsTable
                          applications={filteredApplications}
                          onViewDetails={(app) => { setSelectedApplication(app); setModalOpen(true); }}
                        />
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
            <TalentPool />
            <div className="relative">
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">🚀</span>
                <p className="font-medium text-foreground">Demnächst verfügbar</p>
                <p className="text-sm text-muted-foreground">Matching & Vorschläge wird gerade entwickelt</p>
              </div>
              <div className="opacity-30 pointer-events-none select-none">
                <RecommendationManagement />
              </div>
            </div>
          </div>
        )}

        {/* ── Kanzleien ──────────────────────────────────────────────── */}
        {activeMainTab === "kanzleien" && (
          <CompanyManagement
            navigateToCompanyId={navigateToCompanyId}
            onNavigated={() => setNavigateToCompanyId(null)}
          />
        )}

        {/* ── Stellenanzeigen ────────────────────────────────────────── */}
        {activeMainTab === "stellen" && <JobManagement />}

        {/* ── Blog ───────────────────────────────────────────────────── */}
        {activeMainTab === "blog" && <ArticleManagement />}

      </div>

      {/* ── Modals (global) ────────────────────────────────────────────── */}
      <ApplicationDetailsModal
        application={selectedApplication}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isArchived={activeSubTab === "archived"}
        onArchive={
          activeSubTab === "active"
            ? (id) => archiveMutation.mutate(id)
            : (id) => restoreMutation.mutate(id)
        }
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <NewLeadsModal
        open={leadsModalOpen}
        onOpenChange={setLeadsModalOpen}
        onNavigateToLeads={() => handleMainTabChange("posteingang")}
      />
    </div>
  );
};

const AdminDashboard = () => (
  <AdminAuthGuard>
    <AdminDashboardContent />
  </AdminAuthGuard>
);

export default AdminDashboard;
