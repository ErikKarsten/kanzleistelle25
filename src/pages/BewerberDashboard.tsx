import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWindow from "@/components/ChatWindow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Calendar,
  MessageCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }> = {
  pending: { label: "Neu", variant: "default", className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100" },
  reviewing: { label: "In Prüfung", variant: "default", className: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100" },
  interview: { label: "Einladung", variant: "default", className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" },
  accepted: { label: "Angenommen", variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  rejected: { label: "Abgelehnt", variant: "destructive", className: "" },
};

const BewerberDashboard = () => {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading, isAuthenticated } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);

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

  // Fetch applicant's applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ["applicant-applications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(title, company, company_id, location)")
        .eq("applicant_id", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch company logos for applications
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

  // Fetch unread message counts
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Meine Bewerbungen</h1>
          <p className="text-muted-foreground mt-1">
            Verfolge den Status deiner Bewerbungen und kommuniziere direkt mit Kanzleien.
          </p>
        </div>

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

              return (
                <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                          <Badge variant={status.variant} className={status.className}>
                            {status.label}
                          </Badge>
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

                        <div className="mt-3">
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
      </main>
      <Footer />

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
    </div>
  );
};

export default BewerberDashboard;
