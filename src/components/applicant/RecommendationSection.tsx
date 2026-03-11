import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Building2, Check, X, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { buildRecommendationAcceptedEmail } from "@/lib/emailTemplates";

const RecommendationSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: recommendations } = useQuery({
    queryKey: ["applicant-recommendations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .eq("applicant_user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const acceptMutation = useMutation({
    mutationFn: async (rec: any) => {
      // 1. Get applicant profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user!.id)
        .single();

      // Get existing application data if any (for copying profile fields)
      const { data: existingApps } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user!.id)
        .limit(1);

      const existingApp = existingApps?.[0];
      const firstName = profile?.full_name?.split(" ")[0] || existingApp?.first_name || "";
      const lastName = profile?.full_name?.split(" ").slice(1).join(" ") || existingApp?.last_name || "";

      // 2. Create application
      const { data: newApp, error: appError } = await supabase
        .from("applications")
        .insert({
          user_id: user!.id,
          applicant_id: user!.id,
          company_id: rec.company_id,
          job_id: rec.job_id || null,
          first_name: firstName,
          last_name: lastName,
          email: profile?.email || user!.email,
          phone: profile?.phone || existingApp?.phone || null,
          applicant_role: existingApp?.applicant_role || null,
          experience: existingApp?.experience || null,
          resume_url: existingApp?.resume_url || null,
          special_skills: existingApp?.special_skills || null,
          salary_expectation: existingApp?.salary_expectation || null,
          earliest_start_date: existingApp?.earliest_start_date || null,
          notice_period: existingApp?.notice_period || null,
          cover_letter: `Kandidat wurde von Kanzleistelle24 empfohlen (Matching).`,
          status: "pending",
          internal_notes: "source: recommendation",
        })
        .select()
        .single();

      if (appError) throw appError;

      // 3. Update recommendation
      const { error: recError } = await supabase
        .from("recommendations")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          resulting_application_id: newApp.id,
        })
        .eq("id", rec.id);

      if (recError) throw recError;

      // 4. Send email to employer
      try {
        const { data: company } = await supabase
          .from("companies")
          .select("user_id, name")
          .eq("id", rec.company_id)
          .single();

        if (company?.user_id) {
          const { data: employerProfile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", company.user_id)
            .single();

          if (employerProfile?.email) {
            const applicantFullName = [firstName, lastName].filter(Boolean).join(" ") || "Ein Kandidat";
            const emailData = buildRecommendationAcceptedEmail({
              applicantName: applicantFullName,
              companyName: company.name,
              jobTitle: rec.job_title || null,
            });

            await supabase.functions.invoke("send-contact-email", {
              body: {
                to_email: employerProfile.email,
                to_name: company.name,
                subject: emailData.subject,
                html: emailData.html,
              },
            });
          }
        }
      } catch (e) {
        console.error("Email send failed:", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicant-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["applicant-applications"] });
      toast.success("Vorstellung bestätigt! Die Kanzlei wurde informiert.");
    },
    onError: () => toast.error("Fehler bei der Bestätigung"),
  });

  const rejectMutation = useMutation({
    mutationFn: async (recId: string) => {
      const { error } = await supabase
        .from("recommendations")
        .update({ status: "rejected" })
        .eq("id", recId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicant-recommendations"] });
      toast("Vorschlag abgelehnt");
    },
    onError: () => toast.error("Fehler beim Ablehnen"),
  });

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Empfehlungen für dich</h2>
        <Badge className="bg-primary/10 text-primary border-primary/20">{recommendations.length} neu</Badge>
      </div>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{rec.company_name}</span>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      Empfohlen
                    </Badge>
                  </div>
                  {rec.job_title && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 ml-6">
                      <Briefcase className="h-3 w-3" />
                      {rec.job_title}
                    </p>
                  )}
                  {rec.admin_note && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      „{rec.admin_note}"
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => rejectMutation.mutate(rec.id)}
                    disabled={rejectMutation.isPending || acceptMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Nein
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => acceptMutation.mutate(rec)}
                    disabled={acceptMutation.isPending || rejectMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Ja, bitte vorstellen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecommendationSection;
