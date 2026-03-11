import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import confetti from "canvas-confetti";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  Users,
  Building2,
  Plus,
  Eye,
  Pencil,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  Calendar,
  Loader2,
  FileText,
  Paperclip,
  AlertCircle,
  Archive,
  RotateCcw,
  Trash2,
  Info,
  Sparkles,
  ArrowRight,
  Settings,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import EmployerJobModal from "@/components/employer/EmployerJobModal";
import LogoUpload from "@/components/employer/LogoUpload";
import EmployerOnboarding from "@/components/employer/EmployerOnboarding";
import NewApplicantModal, { useNewApplicantNotification } from "@/components/employer/NewApplicantModal";
import WelcomeBackModal from "@/components/employer/WelcomeBackModal";
import CompanyBlockedScreen from "@/components/employer/CompanyBlockedScreen";
import ApplicantDetailSheet from "@/components/employer/ApplicantDetailSheet";
import EmployerJobDetailsModal from "@/components/employer/EmployerJobDetailsModal";
import ChatWindow from "@/components/ChatWindow";
import UnreadMessagesModal from "@/components/employer/UnreadMessagesModal";
import RecentMessagesEmployer from "@/components/employer/RecentMessagesEmployer";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import UpdatedProfilesWidget from "@/components/employer/UpdatedProfilesWidget";
import { toast as sonnerToast } from "sonner";

// Helper: compute ampel color based on updated_at
function getAmpelStatus(updatedAt: string | null): "green" | "yellow" | "red" {
  if (!updatedAt) return "red";
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 3) return "green";
  if (diffDays <= 7) return "yellow";
  return "red";
}

const ampelColors = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
};

// Reusable application card for active/archived views
const ApplicationCard = ({
  app,
  onStatusChange,
  onArchiveToggle,
  onDelete,
  isArchived,
  toast,
  onClickDetail,
  onChat,
  hasUnread,
}: {
  app: any;
  onStatusChange: (appId: string, status: string) => void;
  onArchiveToggle: (appId: string) => void;
  onDelete?: (appId: string) => void;
  isArchived: boolean;
  toast: any;
  onClickDetail?: (app: any) => void;
  onChat?: (app: any) => void;
  hasUnread?: boolean;
}) => {
  const deletionDate = app.created_at
    ? new Date(new Date(app.created_at).getTime() + 6 * 30 * 24 * 60 * 60 * 1000)
    : null;

  const ampel = getAmpelStatus(app.updated_at);

  return (
  <div
    onClick={() => onClickDetail?.(app)}
    className={`p-4 border rounded-lg transition-all duration-300 cursor-pointer ${
      !isArchived && app.status === "pending"
        ? "border-orange-200 bg-orange-50/50"
        : isArchived
        ? "bg-muted/30 opacity-80"
        : "hover:bg-secondary/50"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {!isArchived && (
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${ampelColors[ampel]}`}
                title={ampel === "green" ? "Aktivität < 3 Tage" : ampel === "yellow" ? "Aktivität 4–7 Tage" : "Keine Aktivität seit > 7 Tagen"}
              />
            )}
            {app.first_name} {app.last_name}
          </h3>
          {!isArchived && app.status === "pending" && (
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              Neu
            </Badge>
          )}
          {!isArchived && app.applicant_updated_at && app.last_viewed_by_employer && 
           new Date(app.applicant_updated_at) > new Date(app.last_viewed_by_employer) && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
              <Sparkles className="h-3 w-3 mr-0.5" />
              Aktualisiert
            </Badge>
          )}
          {!isArchived && app.applicant_updated_at && !app.last_viewed_by_employer && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
              <Sparkles className="h-3 w-3 mr-0.5" />
              Aktualisiert
            </Badge>
          )}
          {isArchived && (
            <Badge variant="outline" className="text-muted-foreground">
              Archiviert
            </Badge>
          )}
        </div>
        <p className="text-sm text-primary mt-1">
          {app.jobs?.title || "Unbekannte Stelle"}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
          {app.email && (
            <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-primary">
              <Mail className="h-3 w-3" />
              {app.email}
            </a>
          )}
          {app.phone && (
            <a href={`tel:${app.phone}`} className="flex items-center gap-1 hover:text-primary">
              <Phone className="h-3 w-3" />
              {app.phone}
            </a>
          )}
          {app.resume_url && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              Lebenslauf vorhanden
            </span>
          )}
        </div>
        {app.applicant_role && (
          <Badge variant="secondary" className="mt-2">
            {app.applicant_role}
          </Badge>
        )}
        {app.experience && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            <span className="font-medium">Erfahrung:</span> {app.experience}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
        <Select
          value={app.status || "pending"}
          onValueChange={(value) => onStatusChange(app.id, value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Neu</SelectItem>
            <SelectItem value="reviewing">In Prüfung</SelectItem>
            <SelectItem value="interview">Vorstellungsgespräch</SelectItem>
            <SelectItem value="accepted">Angenommen</SelectItem>
            <SelectItem value="rejected">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
        {!isArchived && onChat && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onChat(app); }}
            className="text-xs relative"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Chat
            {hasUnread && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
            )}
          </Button>
        )}
        <Button
          variant={isArchived ? "outline" : "ghost"}
          size="sm"
          onClick={(e) => { e.stopPropagation(); onArchiveToggle(app.id); }}
          className="text-xs"
        >
          {isArchived ? (
            <>
              <RotateCcw className="h-3 w-3 mr-1" />
              Wiederherstellen
            </>
          ) : (
            <>
              <Archive className="h-3 w-3 mr-1" />
              Archivieren
            </>
          )}
        </Button>
        {isArchived && onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(app.id); }}
            className="text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Endgültig löschen
          </Button>
        )}
        {app.created_at && (
          <p className="text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            {format(new Date(app.created_at), "dd. MMM yyyy", { locale: de })}
          </p>
        )}
        {isArchived && deletionDate && (
          <p className="text-xs text-destructive">
            Auto-Löschung: {format(deletionDate, "dd. MMM yyyy", { locale: de })}
          </p>
        )}
      </div>
    </div>
  </div>
  );
};
const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { user, role, companyId, isLoading: authLoading, isAuthenticated, signOut, refreshAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("jobs");
  const [applicationsTab, setApplicationsTab] = useState("active");
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const { applicant: newApplicant, notify: notifyNewApplicant, dismiss: dismissNewApplicant } = useNewApplicantNotification();
  const knownAppIds = useRef<Set<string>>(new Set());
  const [reactivationModalOpen, setReactivationModalOpen] = useState(false);
  const [reactivationShown, setReactivationShown] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [jobDetailsJob, setJobDetailsJob] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatApp, setChatApp] = useState<any>(null);
  const [unreadModalOpen, setUnreadModalOpen] = useState(false);
  const unreadModalShown = useRef(false);

  // Unread messages hook
  const { data: unreadData } = useUnreadMessages(companyId);
  const unreadTotal = unreadData?.total ?? 0;
  const unreadByApp = unreadData?.byApplication ?? {};

  // Show unread messages modal once on load
  useEffect(() => {
    if (unreadTotal > 0 && !unreadModalShown.current) {
      unreadModalShown.current = true;
      setUnreadModalOpen(true);
    }
  }, [unreadTotal]);

  // Realtime: toast on new message from applicant
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel("employer-new-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_type === "applicant") {
            sonnerToast.info("Neue Nachricht von einem Bewerber", {
              description: msg.content?.substring(0, 80) || "Neue Nachricht eingegangen.",
              duration: 5000,
            });
            queryClient.invalidateQueries({ queryKey: ["employer-unread-messages", companyId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, queryClient]);

  // Redirect if not authenticated or admin
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    
    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  // Fetch company data
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["employer-company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch jobs for this company - filter by company_id for data isolation
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["employer-jobs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch applications for this company's jobs - uses both company_id and job_id matching
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["employer-applications", companyId, jobs?.map((j) => j.id)],
    queryFn: async () => {
      if (!companyId) return [];
      
      const jobIds = jobs?.map((j) => j.id) || [];
      
      // Build filter: always match on company_id, also match on job_id if jobs are loaded
      const filters = [`company_id.eq.${companyId}`];
      if (jobIds.length > 0) {
        filters.push(`job_id.in.(${jobIds.join(",")})`);
      }
      
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(title, company_id)")
        .or(filters.join(","))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !jobsLoading,
  });

  // Seed known IDs once applications load
  useEffect(() => {
    if (applications) {
      applications.forEach((a: any) => knownAppIds.current.add(a.id));
    }
  }, [applications]);

  // Realtime subscription for new applications with confetti notification
  useEffect(() => {
    if (!companyId) return;
    
    const channel = supabase
      .channel("employer-applications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "applications",
        },
        async (payload) => {
          const newRow = payload.new as any;
          // Skip if already known (dedup)
          if (knownAppIds.current.has(newRow.id)) return;
          knownAppIds.current.add(newRow.id);

          // Check if this application belongs to our company
          const belongsToCompany = newRow.company_id === companyId;
          let jobTitle: string | null = null;

          if (!belongsToCompany && newRow.job_id) {
            // Check if the job belongs to our company
            const currentJobs = queryClient.getQueryData<any[]>(["employer-jobs", companyId]);
            const match = currentJobs?.find((j) => j.id === newRow.job_id);
            if (!match) return; // Not our application
            jobTitle = match.title;
          }

          if (!jobTitle && newRow.job_id) {
            const cachedJobs = queryClient.getQueryData<any[]>(["employer-jobs", companyId]);
            jobTitle = cachedJobs?.find((j: any) => j.id === newRow.job_id)?.title || null;
          }

          // Invalidate queries to update counters & list
          queryClient.invalidateQueries({ queryKey: ["employer-applications", companyId] });

          // Trigger confetti + modal
          notifyNewApplicant({
            id: newRow.id,
            first_name: newRow.first_name,
            last_name: newRow.last_name,
            jobTitle,
            created_at: newRow.created_at,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["employer-applications", companyId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "applications",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["employer-applications", companyId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, queryClient, notifyNewApplicant]);

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { name: string; location: string; description: string; logo_url?: string }) => {
      if (!companyId) throw new Error("No company ID");
      const { error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-company"] });
      refreshAuth();
      toast({ title: "Profil aktualisiert!" });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle job status
  const toggleJobMutation = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: isActive })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      toast({ description: variables.isActive ? "Stelle ist jetzt Live" : "Stelle wurde deaktiviert" });
    },
  });

  // Update application status
  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-applications", companyId] });
      toast({ title: "Status aktualisiert!" });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Archive/restore application
  const archiveApplicationMutation = useMutation({
    mutationFn: async ({ appId, archive }: { appId: string; archive: boolean }) => {
      const { error } = await supabase
        .from("applications")
        .update({ is_archived: archive, updated_at: new Date().toISOString() })
        .eq("id", appId);
      if (error) throw error;
    },
    onSuccess: (_, { archive }) => {
      queryClient.invalidateQueries({ queryKey: ["employer-applications", companyId] });
      sonnerToast.success(archive ? "Bewerber erfolgreich archiviert" : "Bewerber wiederhergestellt", {
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete application permanently (DSGVO)
  const deleteApplicationMutation = useMutation({
    mutationFn: async (appId: string) => {
      const app = applications?.find((a: any) => a.id === appId);
      if (app?.resume_url) {
        await supabase.storage.from("resumes").remove([app.resume_url]);
      }
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-applications", companyId] });
      toast({ title: "Bewerbung endgültig gelöscht" });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateCompanyMutation.mutate({
      name: formData.get("name") as string,
      location: formData.get("location") as string,
      description: formData.get("description") as string,
    });
  };

  // Check if company was just reactivated
  const justReactivated = company?.just_reactivated === true;

  const clearReactivationFlag = useMutation({
    mutationFn: async () => {
      if (!companyId) return;
      const { error } = await supabase
        .from("companies")
        .update({ just_reactivated: false } as any)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-company", companyId] });
    },
  });

  useEffect(() => {
    if (justReactivated && !reactivationShown) {
      setReactivationModalOpen(true);
      setReactivationShown(true);
      const end = Date.now() + 2000;
      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [justReactivated, reactivationShown]);

  const handleCloseReactivationModal = () => {
    setReactivationModalOpen(false);
    clearReactivationFlag.mutate();
  };

  // Listen for edit event from EmployerJobDetailsModal
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setSelectedJob(detail);
        setJobModalOpen(true);
      }
    };
    window.addEventListener("open-job-edit", handler);
    return () => window.removeEventListener("open-job-edit", handler);
  }, []);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No company found - show onboarding
  if (!authLoading && user && !companyId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-secondary/20 py-12">
          <EmployerOnboarding userId={user.id} />
        </main>
        <Footer />
      </div>
    );
  }

  // Company is blocked/deactivated - show blocked screen
  if (company && !company.is_active) {
    return (
      <CompanyBlockedScreen
        companyId={company.id}
        companyName={company.name}
        alreadyRequested={company.reactivation_requested ?? false}
      />
    );
  }

  const activeJobs = jobs?.filter((j) => j.is_active) || [];
  const activeApplications = applications?.filter((a) => !a.is_archived) || [];
  const archivedApplications = applications?.filter((a) => a.is_archived) || [];
  const pendingApplications = activeApplications.filter((a) => a.status === "pending");

  // Ampel: count applications waiting for response (yellow + red)
  const waitingApplications = activeApplications.filter((a) => {
    const ampel = getAmpelStatus(a.updated_at);
    return ampel === "yellow" || ampel === "red";
  });

  // Applications where the applicant updated their profile since the employer last viewed
  const updatedApplications = activeApplications.filter((a: any) => {
    if (!a.applicant_updated_at) return false;
    if (!a.last_viewed_by_employer) return true; // never viewed but applicant updated
    return new Date(a.applicant_updated_at) > new Date(a.last_viewed_by_employer);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-secondary/20 py-8">
        <div className="container">
          {/* Header with prominent CTA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Kanzlei-Dashboard
              </h1>
              <p className="text-muted-foreground">
                Willkommen, {company?.name || "Kanzlei"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                size="lg" 
                className="shadow-lg"
                onClick={() => { setSelectedJob(null); setJobModalOpen(true); }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Neue Stelle schalten
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate("/dashboard/settings")}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={async () => { await signOut(); queryClient.clear(); navigate("/"); }}>
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{jobs?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Stellenanzeigen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeJobs.length}</p>
                    <p className="text-sm text-muted-foreground">Aktive Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{applications?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Bewerbungen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={pendingApplications.length > 0 ? "border-orange-300 bg-orange-50" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    pendingApplications.length > 0 ? "bg-orange-100" : "bg-muted"
                  }`}>
                    <AlertCircle className={`h-6 w-6 ${
                      pendingApplications.length > 0 ? "text-orange-600" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingApplications.length}</p>
                    <p className="text-sm text-muted-foreground">Neue Bewerbungen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Messages Section */}
          <RecentMessagesEmployer
            companyId={companyId}
            applications={applications}
            onOpenChat={(app) => { setChatApp(app); setChatOpen(true); }}
          />

          {/* Updated Profiles Widget */}
          <UpdatedProfilesWidget
            updatedApplications={updatedApplications}
            onViewProfile={(app) => {
              setActiveTab("applications");
              setApplicationsTab("active");
              setSelectedApplicant(app);
            }}
          />

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Offene Stellen
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2 relative">
                <Users className="h-4 w-4" />
                Bewerbungen
                {unreadTotal > 0 ? (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs">
                    {unreadTotal}
                  </Badge>
                ) : pendingApplications.length > 0 ? (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {pendingApplications.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Kanzlei-Profil
              </TabsTrigger>
            </TabsList>

            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Ihre Stellenanzeigen</CardTitle>
                    <CardDescription>
                      {activeJobs.length} aktive von {jobs?.length || 0} Stellen
                    </CardDescription>
                  </div>
                  <Button onClick={() => { setSelectedJob(null); setJobModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Stelle
                  </Button>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : jobs && jobs.length > 0 ? (
                    <div className="space-y-4">
                      {jobs.map((job) => {
                        const isPublished = job.status === "published";
                        const isPending = job.status === "pending" || !job.status;
                        return (
                        <div
                          key={job.id}
                          onClick={() => { setJobDetailsJob(job); setJobDetailsOpen(true); }}
                          className={`flex items-center justify-between p-4 border rounded-lg transition-colors cursor-pointer ${
                            isPending
                              ? "border-muted bg-muted/20"
                              : job.is_active 
                                ? "hover:bg-secondary/50" 
                                : "bg-muted/30 opacity-75"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground">{job.title}</h3>
                              {isPublished && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border" style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
                                  ✨ Freigegeben
                                </span>
                              )}
                              {isPending && (
                                <Badge variant="outline" className="text-xs text-muted-foreground bg-muted/50">
                                  In Prüfung
                                </Badge>
                              )}
                              {isPublished && !job.is_active && (
                                <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              {job.location && <span>{job.location}</span>}
                              {job.employment_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {job.employment_type}
                                </Badge>
                              )}
                              <span className="text-xs">
                                Erstellt: {format(new Date(job.created_at!), "dd.MM.yyyy", { locale: de })}
                              </span>
                            </div>
                            {isPending && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                Wartet auf Admin-Freigabe. Schalter deaktiviert.
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {isPending ? "Offline" : job.is_active ? "Aktiv" : "Inaktiv"}
                              </span>
                              <Switch
                                checked={isPublished ? (job.is_active || false) : false}
                                disabled={isPending}
                                onCheckedChange={(checked) =>
                                  toggleJobMutation.mutate({ jobId: job.id, isActive: checked })
                                }
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedJob(job); setJobModalOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                      <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Noch keine Stellenanzeigen</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Erstellen Sie Ihre erste Stellenanzeige und erreichen Sie qualifizierte Bewerber.
                      </p>
                      <Button size="lg" onClick={() => { setSelectedJob(null); setJobModalOpen(true); }}>
                        <Plus className="h-5 w-5 mr-2" />
                        Erste Stelle erstellen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Eingegangene Bewerbungen</CardTitle>
                  <CardDescription>
                    Bewerbungen auf Ihre Stellenanzeigen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Inner Tabs: Aktiv / Archiv */}
                  <Tabs value={applicationsTab} onValueChange={setApplicationsTab}>
                    <TabsList>
                      <TabsTrigger value="active" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Aktiv
                        {activeApplications.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">{activeApplications.length}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="archived" className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Archiv
                        {archivedApplications.length > 0 && (
                          <Badge variant="outline" className="ml-1 text-xs">{archivedApplications.length}</Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                      {applicationsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : activeApplications.length > 0 ? (
                        <div className="space-y-4">
                          {activeApplications.map((app) => (
                            <ApplicationCard
                              key={app.id}
                              app={app}
                              onStatusChange={(appId, status) => updateApplicationStatusMutation.mutate({ appId, status })}
                              onArchiveToggle={(appId) => archiveApplicationMutation.mutate({ appId, archive: true })}
                              isArchived={false}
                              toast={toast}
                              onClickDetail={(a) => setSelectedApplicant(a)}
                              onChat={(a) => { setChatApp(a); setChatOpen(true); }}
                              hasUnread={!!unreadByApp[app.id]}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Noch keine aktiven Bewerbungen.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="archived">
                      <div className="flex items-start gap-2 mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>Archivierte Bewerber werden gemäß DSGVO nach 6 Monaten endgültig aus dem System entfernt. Bei einem Löschverlangen des Bewerbers können Sie die Daten sofort löschen.</p>
                      </div>
                      {applicationsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : archivedApplications.length > 0 ? (
                        <div className="space-y-4">
                          {archivedApplications.map((app) => (
                            <ApplicationCard
                              key={app.id}
                              app={app}
                              onStatusChange={(appId, status) => updateApplicationStatusMutation.mutate({ appId, status })}
                              onArchiveToggle={(appId) => archiveApplicationMutation.mutate({ appId, archive: false })}
                              onDelete={(appId) => deleteApplicationMutation.mutate(appId)}
                              isArchived={true}
                              toast={toast}
                              onClickDetail={(a) => setSelectedApplicant(a)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Keine archivierten Bewerbungen.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Kanzlei-Profil bearbeiten</CardTitle>
                  <CardDescription>
                    Diese Informationen werden auf Ihren Stellenanzeigen angezeigt.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {companyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : company ? (
                    <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-xl">
                      <LogoUpload
                        currentLogoUrl={company.logo_url}
                        companyName={company.name}
                        onUploadComplete={(url) => {
                          updateCompanyMutation.mutate({
                            name: company.name,
                            location: company.location || "",
                            description: company.description || "",
                            logo_url: url || undefined,
                          });
                        }}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="name">Kanzleiname *</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={company.name}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Standort</Label>
                        <Input
                          id="location"
                          name="location"
                          defaultValue={company.location || ""}
                          placeholder="z.B. München"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                          id="description"
                          name="description"
                          defaultValue={company.description || ""}
                          rows={4}
                          placeholder="Erzählen Sie Bewerbern etwas über Ihre Kanzlei..."
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={updateCompanyMutation.isPending}
                      >
                        {updateCompanyMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Wird gespeichert...
                          </>
                        ) : (
                          "Profil speichern"
                        )}
                      </Button>
                    </form>
                  ) : (
                    <p className="text-muted-foreground">
                      Kein Kanzlei-Profil gefunden.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Job Modal */}
      <EmployerJobModal
        open={jobModalOpen}
        onOpenChange={setJobModalOpen}
        job={selectedJob}
        companyId={companyId}
        companyName={company?.name || ""}
      />

      {/* Job Details Modal (view + applicants) */}
      <EmployerJobDetailsModal
        open={jobDetailsOpen}
        onOpenChange={setJobDetailsOpen}
        job={jobDetailsJob}
        companyId={companyId}
        companyName={company?.name || ""}
        onOpenApplicant={(app) => {
          setJobDetailsOpen(false);
          setSelectedApplicant(app);
        }}
      />

      <NewApplicantModal
        applicant={newApplicant}
        onDismiss={dismissNewApplicant}
        onViewDetails={(appId) => {
          setActiveTab("applications");
          setApplicationsTab("active");
          // Find the application by ID and open it
          const found = applications?.find((a: any) => a.id === appId);
          if (found) setSelectedApplicant(found);
        }}
      />


      {/* Welcome Back Modal (once per session) */}
      <WelcomeBackModal
        newApplications={pendingApplications}
        onViewAll={() => {
          setActiveTab("applications");
          setApplicationsTab("active");
        }}
      />

      {/* Reactivation Welcome Modal */}
      <Dialog open={reactivationModalOpen} onOpenChange={handleCloseReactivationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Schön, dass Sie wieder dabei sind! ✨</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Ihr Account wurde erfolgreich reaktiviert. Ihre Stellenanzeigen sind ab sofort wieder für Bewerber sichtbar. Viel Erfolg bei der Personalsuche!
            </DialogDescription>
          </DialogHeader>

          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">Aktuell online</p>
            <p className="text-3xl font-bold text-primary">{activeJobs.length}</p>
            <p className="text-sm text-muted-foreground">
              {activeJobs.length === 1 ? "Stellenanzeige" : "Stellenanzeigen"}
            </p>
          </div>

          <Button
            className="w-full mt-2"
            size="lg"
            onClick={() => {
              handleCloseReactivationModal();
              setActiveTab("jobs");
            }}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Zu meinen Stellenanzeigen
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </DialogContent>
      </Dialog>
      {/* Applicant Detail Sheet */}
      <ApplicantDetailSheet
        application={selectedApplicant}
        open={!!selectedApplicant}
        onOpenChange={(open) => { if (!open) setSelectedApplicant(null); }}
        companyId={companyId}
        companyName={company?.name || ""}
      />
      {chatApp && (
        <ChatWindow
          applicationId={chatApp.id}
          applicantName={`${chatApp.first_name} ${chatApp.last_name}`}
          jobTitle={chatApp.jobs?.title || "Bewerbung"}
          open={chatOpen}
          onOpenChange={(open) => {
            setChatOpen(open);
            if (!open) {
              // Refresh unread counts after closing chat
              queryClient.invalidateQueries({ queryKey: ["employer-unread-messages", companyId] });
            }
          }}
          senderType="employer"
        />
      )}

      {/* Unread Messages Modal (session-once) */}
      <UnreadMessagesModal
        open={unreadModalOpen}
        onOpenChange={setUnreadModalOpen}
        unreadCount={unreadTotal}
        onNavigate={() => {
          setActiveTab("applications");
          setApplicationsTab("active");
          // Auto-open chat with first unread applicant
          if (unreadByApp && applications) {
            const firstUnreadAppId = Object.keys(unreadByApp)[0];
            if (firstUnreadAppId) {
              const app = applications.find((a: any) => a.id === firstUnreadAppId);
              if (app) {
                setTimeout(() => {
                  setChatApp(app);
                  setChatOpen(true);
                }, 300);
              }
            }
          }
        }}
      />
    </div>
  );
};

export default EmployerDashboard;
