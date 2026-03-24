import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2, MapPin, Plus, Trash2, Pencil, Archive, ArchiveRestore, Bell, AlertTriangle, Siren, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import CompanyDetailsModal, { getHighestSlaLevel } from "./CompanyDetailsModal";
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
  last_sign_in_at: string | null;
}

interface CompanyManagementProps {
  navigateToCompanyId?: string | null;
  onNavigated?: () => void;
}

const getDaysInactive = (lastSignIn: string | null): number => {
  if (!lastSignIn) return 999;
  const diff = Date.now() - new Date(lastSignIn).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const CompanyManagement = ({ navigateToCompanyId, onNavigated }: CompanyManagementProps) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [activePage, setActivePage] = useState(1);
  const [archivedPage, setArchivedPage] = useState(1);
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

  const { data: pendingApplications } = useQuery({
    queryKey: ["admin-sla-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, company_id, status, created_at")
        .eq("is_archived", false)
        .in("status", ["pending", "neu", "eingegangen"]);
      if (error) throw error;
      return data || [];
    },
  });

  const companySlaMap = useMemo(() => {
    if (!pendingApplications) return new Map<string, "ok" | "warning" | "urgent" | "critical">();
    const grouped: Record<string, { status: string | null; created_at: string | null }[]> = {};
    pendingApplications.forEach((app) => {
      if (!app.company_id) return;
      if (!grouped[app.company_id]) grouped[app.company_id] = [];
      grouped[app.company_id].push(app);
    });
    const map = new Map<string, "ok" | "warning" | "urgent" | "critical">();
    Object.entries(grouped).forEach(([companyId, apps]) => {
      map.set(companyId, getHighestSlaLevel(apps));
    });
    return map;
  }, [pendingApplications]);

  useEffect(() => {
    if (navigateToCompanyId && companies) {
      const company = companies.find((c) => c.id === navigateToCompanyId);
      if (company) {
        setSelectedCompany(company);
        setDetailsOpen(true);
        onNavigated?.();
      }
    }
  }, [navigateToCompanyId, companies, onNavigated]);

  // Reset pages when search changes
  useEffect(() => {
    setActivePage(1);
    setArchivedPage(1);
  }, [searchQuery, pageSize]);

  const deleteMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", companyId);
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
      queryClient.invalidateQueries({ queryKey: ["reactivation-requests"] });
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

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    if (!searchQuery.trim()) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  const activeCompanies = filteredCompanies.filter((c) => c.is_active);
  const archivedCompanies = filteredCompanies.filter((c) => !c.is_active);

  const activeTotalPages = Math.max(1, Math.ceil(activeCompanies.length / pageSize));
  const archivedTotalPages = Math.max(1, Math.ceil(archivedCompanies.length / pageSize));

  const activePagedCompanies = activeCompanies.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize
  );
  const archivedPagedCompanies = archivedCompanies.slice(
    (archivedPage - 1) * pageSize,
    archivedPage * pageSize
  );

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

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    onPageChange: (page: number) => void
  ) => (
    <div className="flex items-center justify-between pt-4 border-t">
      <p className="text-sm text-muted-foreground">
        {totalItems} Einträge gesamt
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Seite {currentPage} von {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderTable = (list: Company[]) => (
    <TooltipProvider>
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
            {list.map((company) => {
              const daysInactive = getDaysInactive(company.last_sign_in_at);
              const nearExpiry = company.is_active && daysInactive >= 80;

              return (
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
                      {nearExpiry && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Letzter Login vor {daysInactive} Tagen – automatische Archivierung bei 90 Tagen</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {(() => {
                        const sla = companySlaMap.get(company.id);
                        if (!sla || sla === "ok") return null;
                        const slaColors = { warning: "text-yellow-500", urgent: "text-orange-500", critical: "text-destructive" };
                        const slaLabels = { warning: "Bewerbungen warten 3+ Tage", urgent: "Bewerbungen warten 7+ Tage", critical: "Bewerbungen warten 14+ Tage – Bewerberverlust droht!" };
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center">
                                <Siren className={`h-4 w-4 ${slaColors[sla]} ${sla === "critical" ? "animate-pulse" : ""}`} />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{slaLabels[sla]}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })()}
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
                      <Button variant="ghost" size="icon" onClick={() => handleCompanyClick(company)} title="Bearbeiten">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => archiveMutation.mutate({ id: company.id, is_active: !company.is_active })}
                        title={company.is_active ? "Archivieren" : "Reaktivieren"}
                      >
                        {company.is_active ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
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
                              Möchten Sie „{company.name}" wirklich löschen? Alle zugeordneten Stellenanzeigen werden ebenfalls entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
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
        <CardContent className="space-y-4">

          {/* Suche + Einträge pro Seite */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kanzlei suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Einträge pro Seite:</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeCompanies.length === 0 && archivedCompanies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "Keine Kanzleien gefunden." : "Noch keine Kanzleien vorhanden."}
              </p>
            </div>
          ) : (
            <>
              {activeCompanies.length > 0 && (
                <div className="space-y-2">
                  {renderTable(activePagedCompanies)}
                  {renderPagination(activePage, activeTotalPages, activeCompanies.length, setActivePage)}
                </div>
              )}
              {archivedCompanies.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Archiviert ({archivedCompanies.length})
                  </h3>
                  <div className="opacity-60">
                    {renderTable(archivedPagedCompanies)}
                  </div>
                  {renderPagination(archivedPage, archivedTotalPages, archivedCompanies.length, setArchivedPage)}
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