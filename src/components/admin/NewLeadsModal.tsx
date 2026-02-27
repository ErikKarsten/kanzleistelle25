import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface NewLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToLeads: () => void;
}

export const useNewLeadsCount = () => {
  return useQuery({
    queryKey: ["admin-new-leads-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_leads")
        .select("id, full_name, created_at")
        .eq("status", "neu")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

const NewLeadsModal = ({ open, onOpenChange, onNavigateToLeads }: NewLeadsModalProps) => {
  const { data: newLeads } = useNewLeadsCount();

  const count = newLeads?.length ?? 0;
  const preview = newLeads?.slice(0, 3) ?? [];

  if (count === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl flex items-center justify-center gap-2">
            <span className="text-2xl">👋</span> Neue Kontaktanfragen
          </DialogTitle>
          <DialogDescription className="text-base pt-1">
            Es gibt <span className="font-semibold text-foreground">{count}</span> neue
            Kontaktanfrage{count !== 1 ? "n" : ""} für Neele Ehlers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {preview.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm">{lead.full_name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(lead.created_at), "dd.MM.yy", { locale: de })}
              </span>
            </div>
          ))}
          {count > 3 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              … und {count - 3} weitere
            </p>
          )}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            onOpenChange(false);
            onNavigateToLeads();
          }}
        >
          Jetzt zum Posteingang
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default NewLeadsModal;
