import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, Globe, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface ContactLead {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  source_url: string | null;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  neu: { label: "Neu", className: "bg-yellow-100 text-yellow-800" },
  "in Bearbeitung": { label: "In Bearbeitung", className: "bg-blue-100 text-blue-800" },
  abgeschlossen: { label: "Abgeschlossen", className: "bg-green-100 text-green-800" },
};

const LeadManagement = () => {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<ContactLead | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-contact-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactLead[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("contact_leads")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-leads"] });
      toast.success("Status aktualisiert");
    },
    onError: () => toast.error("Fehler beim Aktualisieren"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-leads"] });
      toast.success("Nachricht gelöscht");
      setSelectedLead(null);
    },
    onError: () => toast.error("Fehler beim Löschen"),
  });

  const newCount = leads?.filter((l) => l.status === "neu").length ?? 0;

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Posteingang
          {newCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800">{newCount} neu</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : !leads?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Kontaktanfragen.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead className="hidden md:table-cell">Nachricht</TableHead>
                  <TableHead className="hidden lg:table-cell">Quelle</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const isNew = lead.status === "neu";
                  return (
                    <TableRow
                      key={lead.id}
                      className={`cursor-pointer hover:bg-muted/50 ${isNew ? "font-semibold" : ""}`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isNew && <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />}
                          {lead.full_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                        {lead.message}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                        {lead.source_url || "–"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {format(new Date(lead.created_at), "dd.MM.yy HH:mm", { locale: de })}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={lead.status}
                          onValueChange={(val) => statusMutation.mutate({ id: lead.id, status: val })}
                        >
                          <SelectTrigger className="w-[150px] h-8 border-none p-0 focus:ring-0">
                            <Badge className={STATUS_CONFIG[lead.status]?.className ?? "bg-muted"}>
                              {STATUS_CONFIG[lead.status]?.label ?? lead.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Kontaktanfrage von {selectedLead?.full_name}</DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                    <Mail className="h-4 w-4" /> {selectedLead.email}
                  </a>
                  {selectedLead.phone && (
                    <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                      <Phone className="h-4 w-4" /> {selectedLead.phone}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(selectedLead.created_at), "dd. MMMM yyyy, HH:mm 'Uhr'", { locale: de })}
                  </span>
                  {selectedLead.source_url && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" /> {selectedLead.source_url}
                    </span>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {selectedLead.message}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Select
                    value={selectedLead.status}
                    onValueChange={(val) => {
                      statusMutation.mutate({ id: selectedLead.id, status: val });
                      setSelectedLead({ ...selectedLead, status: val });
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(selectedLead.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Löschen
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default LeadManagement;
