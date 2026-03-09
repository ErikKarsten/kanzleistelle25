import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Conversation {
  applicationId: string;
  companyName: string;
  companyLogo: string | null;
  jobTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  isUnread: boolean;
  app: any;
}

interface RecentMessagesApplicantProps {
  userId: string;
  applications: any[] | undefined;
  companies: any[] | undefined;
  onOpenChat: (app: any) => void;
}

const RecentMessagesApplicant = ({
  userId,
  applications,
  companies,
  onOpenChat,
}: RecentMessagesApplicantProps) => {
  const queryClient = useQueryClient();

  const appIds = applications?.map((a: any) => a.id) || [];

  const { data: conversations } = useQuery({
    queryKey: ["applicant-recent-conversations", userId, appIds.length],
    queryFn: async (): Promise<Conversation[]> => {
      if (appIds.length === 0) return [];

      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .in("application_id", appIds)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error || !msgs || msgs.length === 0) return [];

      const latestByApp: Record<string, any> = {};
      const unreadByApp: Record<string, boolean> = {};

      for (const msg of msgs) {
        if (!latestByApp[msg.application_id]) {
          latestByApp[msg.application_id] = msg;
        }
        if (msg.sender_type === "employer" && !msg.is_read) {
          unreadByApp[msg.application_id] = true;
        }
      }

      const convs: Conversation[] = [];
      for (const [appId, lastMsg] of Object.entries(latestByApp)) {
        const app = applications?.find((a: any) => a.id === appId);
        if (!app) continue;
        const company = companies?.find((c: any) => c.id === app.jobs?.company_id);
        convs.push({
          applicationId: appId,
          companyName: app.jobs?.company || "Kanzlei",
          companyLogo: company?.logo_url || null,
          jobTitle: app.jobs?.title || "Bewerbung",
          lastMessage: lastMsg.content || "",
          lastMessageAt: lastMsg.created_at,
          isUnread: !!unreadByApp[appId],
          app,
        });
      }

      convs.sort((a, b) => {
        if (a.isUnread !== b.isUnread) return a.isUnread ? -1 : 1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      return convs;
    },
    enabled: !!userId && appIds.length > 0,
    refetchInterval: 15000,
  });

  // Realtime refresh
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("applicant-conv-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["applicant-recent-conversations", userId] });
          queryClient.invalidateQueries({ queryKey: ["unread-messages", userId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  if (!conversations || conversations.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Meine Nachrichten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-3 pt-0">
        {conversations.map((conv) => (
          <button
            key={conv.applicationId}
            onClick={() => onOpenChat(conv.app)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors text-left"
          >
            {/* Unread indicator */}
            <div className="shrink-0 w-2.5 flex items-center justify-center">
              {conv.isUnread && (
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            <Avatar className="h-9 w-9 rounded-lg border border-border shrink-0">
              {conv.companyLogo ? (
                <AvatarImage src={conv.companyLogo} alt={conv.companyName} className="object-cover" />
              ) : null}
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                {conv.companyName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${conv.isUnread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                  {conv.companyName}
                </p>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {format(new Date(conv.lastMessageAt), "dd. MMM, HH:mm", { locale: de })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                <span className="text-muted-foreground/60">{conv.jobTitle} · </span>
                {conv.lastMessage}
              </p>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentMessagesApplicant;
