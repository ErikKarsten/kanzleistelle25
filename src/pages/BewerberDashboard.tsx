import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWindow from "@/components/ChatWindow";
import WithdrawDialog from "@/components/applicant/WithdrawDialog";
import DeleteAccountDialog from "@/components/applicant/DeleteAccountDialog";
import ApplicationDetailModal from "@/components/applicant/ApplicationDetailModal";
import RecentMessagesApplicant from "@/components/applicant/RecentMessagesApplicant";
import ApplicantProfileEditor from "@/components/applicant/ApplicantProfileEditor";
import ProfileOnboardingPopup from "@/components/applicant/ProfileOnboardingPopup";
import ProfileProgressBar from "@/components/applicant/ProfileProgressBar";
import { calculateProfileCompletion } from "@/lib/profileCompletion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Briefcase,
  Calendar,
  MessageCircle,
  FileText,
  Loader2,
  MoreVertical,
  XCircle,
  Trash2,
  AlertTriangle,
  UserCircle,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }> = {
  pending: { label: "Neu", variant: "default", className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100" },
  reviewing: { label: "In Prüfung", variant: "default", className: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100" },
  interview: { label: "Einladung", variant: "default", className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" },
  accepted: { label: "Angenommen", variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  rejected: { label: "Abgelehnt", variant: "destructive", className: "" },
  withdrawn: { label: "Zurückgezogen", variant: "secondary", className: "bg-muted text-muted-foreground border-border hover:bg-muted" },
};

const BewerberDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role, isLoading: authLoading, isAuthenticated } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [detailApp, setDetailApp] = useState<any>(null);
  const [withdrawApp, setWithdrawApp] = useState<any>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [profileApp, setProfileApp] = useState<any>(null);
  const [mainTab, setMainTab] = useState("applications");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const onboardingShown = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (role === "employer") {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    queryClient.invalidateQueries({ queryKey: ["applicant-applications", user.id] });
  }, [queryClient, user?.id]);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applicant-applications", user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id) return [];

      if (user.email) {
        await supabase.rpc("link_application_to_user", {
          _application_id: "00000000-0000-0000-0000-000000000000",
          _user_id: user.id,
          _email: user.email,
        });

        const { data: byEmail, error: byEmailError } = await supabase
          .from("applications")
          .select("*, jobs(title, company, company_id, location)")
          .eq("email", user.email)
          .eq("is_archived", false)
          .order("created_at", { ascending: false });

        if (byEmailError) throw byEmailError;
        if (byEmail && byEmail.length > 0) return byEmail;
      }

      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(title, company, company_id, location)")
        .or(`applicant_id.eq.${user.id},user_id.eq.${user.id}`)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchOnMount: "always",
  });

  const companyIds = [...new Set(applications?.map((a: any) => a.jobs?.company_id).filter(Boolean) || [])];
  const { data: companies } = useQuery({
    queryKey: ["applicant-companies", companyIds],
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, logo_url")
        .in("id", companyIds);
      if (error) throw error;
      return data;
    },
    enabled: companyIds.length > 0,
  });

  const { data: unreadCounts } = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      if (!user?.id || !applications) return {};
      const appIds = applications.map((a: any) => a.id);
      if (appIds.length === 0) return {};
      const { data, error } = await supabase
        .from("messages")
        .select("application_id")
        .in("application_id", appIds)
        .eq("sender_type", "employer")
        .eq("is_read", false);
      if (error) return {};
      const counts: Record<string, number> = {};
      data?.forEach((m: any) => {
        counts[m.application_id] = (counts[m.application_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user?.id && !!applications && applications.length > 0,
  });

  // Check profile completeness for onboarding popup
  const profileIncomplete = useMemo(() => {
    if (!applications || applications.length === 0) return false;
    const app = applications[0];
    const fields = ["resume_url", "earliest_start_date", "salary_expectation", "notice_period", "special_skills"];
    return fields.some((f) => !app[f] || String(app[f]).trim() === "");
  }, [applications]);

  useEffect(() => {
    if (profileIncomplete && !onboardingShown.current && applications && applications.length > 0) {
      onboardingShown.current = true;
      // Small delay so dashboard renders first
      const t = setTimeout(() => setOnboardingOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [profileIncomplete, applications]);

  const getCompanyLogo = (companyId: string) => {
    return companies?.find((c: any) => c.id === companyId)?.logo_url || null;
  };

  const openChat = (app: any) => {
    setSelectedApp(app);
    setChatOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isWithdrawn = (status: string | null) => status === "withdrawn";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Mein Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Verfolge den Status deiner Bewerbungen, vervollständige dein Profil und kommuniziere direkt mit Kanzleien.
          </p>
        </div>

        {/* Recent Messages Section */}
        <RecentMessagesApplicant
          userId={user?.id || ""}
          applications={applications}
          companies={companies}
          onOpenChat={openChat}
        />

        <Tabs value={mainTab} onValueChange={setMainTab} className="mt-6">
          <TabsList className="mb-6">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Meine Bewerbungen
              {applications && applications.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{applications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Profil bearbeiten
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app: any) => {
                  const status = statusConfig[app.status || "pending"] || statusConfig.pending;
                  const companyLogo = app.jobs?.company_id ? getCompanyLogo(app.jobs.company_id) : null;
                  const unread = unreadCounts?.[app.id] || 0;
                  const withdrawn = isWithdrawn(app.status);

                  return (
                    <Card key={app.id} className={`overflow-hidden transition-shadow cursor-pointer ${withdrawn ? "opacity-60" : "hover:shadow-md"}`} onClick={() => !withdrawn && setDetailApp(app)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 rounded-lg border border-border shrink-0">
                            {companyLogo ? (
                              <AvatarImage src={companyLogo} alt={app.jobs?.company} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                              {(app.jobs?.company || "??").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-foreground truncate">
                                  {app.jobs?.title || "Unbekannte Stelle"}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {app.jobs?.company}
                                  {app.jobs?.location && ` · ${app.jobs.location}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant={status.variant} className={status.className}>
                                  {status.label}
                                </Badge>
                                {!withdrawn && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => { setProfileApp(app); setMainTab("profile"); }}
                                        >
                                          <UserCircle className="h-4 w-4 mr-2" />
                                          Profil bearbeiten
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => setWithdrawApp(app)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Bewerbung zurückziehen
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {app.created_at && format(new Date(app.created_at), "dd. MMM yyyy", { locale: de })}
                              </span>
                              {app.resume_url && (
                                <span className="text-xs text-primary flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Lebenslauf angehängt
                                </span>
                              )}
                            </div>

                            {!withdrawn && (
                              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openChat(app)}
                                  className="relative"
                                >
                                  <MessageCircle className="h-4 w-4 mr-1.5" />
                                  Nachricht
                                  {unread > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                      {unread}
                                    </span>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Noch keine Bewerbungen
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Stöbere durch unsere Stellenangebote und bewirb dich in 30 Sekunden!
                  </p>
                  <Button onClick={() => navigate("/")} variant="default">
                    Stellenangebote ansehen
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {applications && applications.length > 0 ? (
              <>
                {applications.length > 1 && (
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Wähle die Bewerbung, deren Profil du bearbeiten möchtest:</p>
                    <div className="flex flex-wrap gap-2">
                      {applications.map((app: any) => (
                        <Button
                          key={app.id}
                          variant={profileApp?.id === app.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setProfileApp(app)}
                        >
                          {app.jobs?.title || "Bewerbung"} – {app.jobs?.company || ""}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <ApplicantProfileEditor
                  application={profileApp || applications[0]}
                  userId={user?.id || ""}
                />
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <UserCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Bewirb dich zuerst, um dein Profil zu vervollständigen.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Account Settings Section */}
        <Separator className="my-10" />
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Einstellungen</h2>
          <Card className="border-destructive/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Konto dauerhaft löschen</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Alle deine Bewerbungen, Nachrichten und persönlichen Daten werden unwiderruflich entfernt.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setShowDeleteAccount(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Mein Konto löschen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {detailApp && (
        <ApplicationDetailModal
          application={detailApp}
          companyLogo={detailApp.jobs?.company_id ? getCompanyLogo(detailApp.jobs.company_id) : null}
          statusLabel={(statusConfig[detailApp.status || "pending"] || statusConfig.pending).label}
          statusClassName={(statusConfig[detailApp.status || "pending"] || statusConfig.pending).className}
          open={!!detailApp}
          onOpenChange={(open) => !open && setDetailApp(null)}
          onOpenChat={() => openChat(detailApp)}
        />
      )}

      {selectedApp && (
        <ChatWindow
          applicationId={selectedApp.id}
          applicantName={`${selectedApp.first_name} ${selectedApp.last_name}`}
          jobTitle={selectedApp.jobs?.title || "Bewerbung"}
          open={chatOpen}
          onOpenChange={setChatOpen}
          senderType="applicant"
        />
      )}

      {withdrawApp && (
        <WithdrawDialog
          open={!!withdrawApp}
          onOpenChange={(open) => !open && setWithdrawApp(null)}
          applicationId={withdrawApp.id}
          jobTitle={withdrawApp.jobs?.title || "Bewerbung"}
        />
      )}

      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
      />

      {applications && applications.length > 0 && (
        <ProfileOnboardingPopup
          open={onboardingOpen}
          onOpenChange={setOnboardingOpen}
          application={applications[0]}
          firstName={applications[0]?.first_name || user?.user_metadata?.first_name || ""}
          onComplete={() => {
            setOnboardingOpen(false);
            setProfileApp(applications[0]);
            setMainTab("profile");
          }}
        />
      )}
    </div>
  );
};

export default BewerberDashboard;
