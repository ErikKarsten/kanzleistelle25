import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface ReactivationRequestsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CompanyRequest {
  id: string;
  name: string;
  location: string | null;
  reactivation_requested_at: string | null;
}

export const useReactivationRequests = () => {
  return useQuery({
    queryKey: ["reactivation-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, location, reactivation_requested_at")
        .eq("reactivation_requested", true)
        .eq("is_active", false)
        .order("reactivation_requested_at", { ascending: false });

      if (error) throw error;
      return data as CompanyRequest[];
    },
    refetchInterval: 30000, // Poll every 30s
  });
};

const ReactivationRequests = ({ open, onOpenChange }: ReactivationRequestsProps) => {
  const queryClient = useQueryClient();
  const { data: requests } = useReactivationRequests();

  const approveMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from("companies")
        .update({ is_active: true } as any)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reactivation-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("Kanzlei reaktiviert");
    },
    onError: () => {
      toast.error("Fehler beim Reaktivieren");
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from("companies")
        .update({
          reactivation_requested: false,
          reactivation_requested_at: null,
        } as any)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reactivation-requests"] });
      toast.success("Anfrage abgelehnt");
    },
    onError: () => {
      toast.error("Fehler");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Reaktivierungsanfragen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
          {!requests || requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Keine offenen Anfragen.
            </p>
          ) : (
            requests.map((req) => (
              <Card key={req.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{req.name}</span>
                      </div>
                      {req.location && (
                        <p className="text-xs text-muted-foreground">{req.location}</p>
                      )}
                      {req.reactivation_requested_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(req.reactivation_requested_at), {
                            addSuffix: true,
                            locale: de,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(req.id)}
                        disabled={approveMutation.isPending}
                        className="gap-1"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Freigeben
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => denyMutation.mutate(req.id)}
                        disabled={denyMutation.isPending}
                        className="gap-1"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReactivationRequests;
