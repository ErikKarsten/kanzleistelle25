import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, MapPin, Plus, Trash2, Pencil, Archive, ArchiveRestore, Bell } from "lucide-react";
import { toast } from "sonner";
import CompanyDetailsModal from "./CompanyDetailsModal";
import CompanyCreateModal from "./CompanyCreateModal";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  location: string | null;
  created_at: string | null;
  is_active: boolean;
  website: string | null;
  user_id: string | null;
  reactivation_requested: boolean;
}

const CompanyManagement = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Company[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("Kanzlei erfolgreich entfernt");
      setDetailsOpen(false);
    },
    onError: (error: any) => {
      toast.error("Fehler beim Löschen", { description: error.message });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("companies")
        .update({ is_active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(variables.is_active ? "Kanzlei reaktiviert" : "Kanzlei archiviert");
    },
    onError: (error: any) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setDetailsOpen(true);
  };

  const activeCompanies = companies?.filter((c) => c.is_active) || [];
  const archivedCompanies = companies?.filter((c) => !c.is_active) || [];

  if (isLoading) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Kanzleien-Verwaltung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderTable = (list: Company[], showArchiveRestore = false) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Standort</TableHead>
            <TableHead className="font-semibold">Beschreibung</TableHead>
            <TableHead className="font-semibold text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((company) => (
            <TableRow key={company.id} className="hover:bg-muted/30">
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCompanyClick(company)}
                    className="font-medium text-primary hover:underline text-left"
                  >
                    {company.name}
                  </button>
                  {company.reactivation_requested && (
                    <span className="inline-flex items-center animate-pulse" title="Reaktivierung angefragt">
                      <Bell className="h-4 w-4 text-orange-500" />
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {company.location || "—"}
                </div>
              </TableCell>
              <TableCell className="max-w-[300px] truncate text-muted-foreground">
                {company.description || "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCompanyClick(company)}
                    title="Bearbeiten"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      archiveMutation.mutate({
                        id: company.id,
                        is_active: !company.is_active,
                      })
                    }
                    title={company.is_active ? "Archivieren" : "Reaktivieren"}
                  >
                    {company.is_active ? (
                      <Archive className="h-4 w-4" />
                    ) : (
                      <ArchiveRestore className="h-4 w-4" />
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Löschen">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Kanzlei löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Möchten Sie „{company.name}" wirklich löschen? Alle
                          zugeordneten Stellenanzeigen werden ebenfalls entfernt.
                          Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(company.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Endgültig löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Kanzleien-Verwaltung
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neue Kanzlei
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeCompanies.length === 0 && archivedCompanies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Noch keine Kanzleien vorhanden.
              </p>
            </div>
          ) : (
            <>
              {activeCompanies.length > 0 && renderTable(activeCompanies)}

              {archivedCompanies.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Archiviert ({archivedCompanies.length})
                  </h3>
                  <div className="opacity-60">{renderTable(archivedCompanies, true)}</div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CompanyDetailsModal
        company={selectedCompany}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <CompanyCreateModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
};

export default CompanyManagement;
