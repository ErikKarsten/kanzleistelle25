import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, MapPin, Plus } from "lucide-react";
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
      toast.success("Kanzlei gelöscht");
      setDetailsOpen(false);
    },
    onError: () => {
      toast.error("Fehler beim Löschen");
    },
  });

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setDetailsOpen(true);
  };

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
        <CardContent>
          {companies && companies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Noch keine Kanzleien vorhanden.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Standort</TableHead>
                    <TableHead className="font-semibold">Beschreibung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies?.map((company) => (
                    <TableRow key={company.id} className="hover:bg-muted/30">
                      <TableCell>
                        <button
                          onClick={() => handleCompanyClick(company)}
                          className="font-medium text-primary hover:underline text-left"
                        >
                          {company.name}
                        </button>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyDetailsModal
        company={selectedCompany}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <CompanyCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
};

export default CompanyManagement;
