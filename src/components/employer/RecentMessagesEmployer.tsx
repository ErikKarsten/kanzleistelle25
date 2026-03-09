import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Conversation {
  applicationId: string;
  applicantName: string;
  jobTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  isUnread: boolean;
  app: any;
}

interface RecentMessagesEmployerProps {
  companyId: string | null;
  applications: any[] | undefined;
  onOpenChat: (app: any) => void;
}

const RecentMessagesEmployer = ({
  companyId,
  applications,
  onOpenChat,
}: RecentMessagesEmployerProps) => {
  const queryClient = useQueryClient();

  const appIds = applications?.filter((a: any) => !a.is_archived).map((a: any) => a.id) || [];

  const { data: conversations } = useQuery({
    queryKey: ["employer-recent-conversations", companyId, appIds.length],
    queryFn: async (): Promise<Conversation[]> => {
      if (appIds.length === 0) return [];

      // Fetch latest messages per application (batch)
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .in("application_id", appIds)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error || !msgs || msgs.length === 0) return [];

      // Group by application_id, pick latest
      const latestByApp: Record<string, any> = {};
      const unreadByApp: Record<string, boolean> = {};

      for (const msg of msgs) {
        if (!latestByApp[msg.application_id]) {
          latestByApp[msg.application_id] = msg;
        }
        if (msg.sender_type === "applicant" && !msg.is_read) {
          unreadByApp[msg.application_id] = true;
        }
      }

      // Build conversation list
      const convs: Conversation[] = [];
      for (const [appId, lastMsg] of Object.entries(latestByApp)) {
        const app = applications?.find((a: any) => a.id === appId);
        if (!app) continue;
        convs.push({
          applicationId: appId,
          applicantName: `${app.first_name || ""} ${app.last_name || ""}`.trim() || "Bewerber",
          jobTitle: app.jobs?.title || "Bewerbung",
          lastMessage: lastMsg.content || "",
          lastMessageAt: lastMsg.created_at,
          isUnread: !!unreadByApp[appId],
          app,
        });
      }

      // Sort: unread first, then by date
      convs.sort((a, b) => {
        if (a.isUnread !== b.isUnread) return a.isUnread ? -1 : 1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      return convs.slice(0, 10);
    },
    enabled: !!companyId && appIds.length > 0,
    refetchInterval: 15000,
  });

  // Realtime refresh
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel("employer-conv-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["employer-recent-conversations", companyId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, queryClient]);

  if (!conversations || conversations.length === 0) return null;

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Aktuelle Nachrichten
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

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${conv.isUnread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                  {conv.applicantName}
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

export default RecentMessagesEmployer;
