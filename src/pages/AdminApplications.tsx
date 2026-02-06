import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Mail, Phone, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import AdminNav from "@/components/AdminNav";
import AdminAuthGuard from "@/components/AdminAuthGuard";

interface ApplicationWithJob {
   id: string;
   first_name: string | null;
   last_name: string | null;
   email: string | null;
   phone: string | null;
   status: string | null;
   created_at: string | null;
   jobs: {
     title: string;
     company: string;
   } | null;
 }
 
const AdminApplicationsContent = () => {
  const { data: applications, isLoading, error } = useQuery({
     queryKey: ["admin-applications"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("applications")
         .select(`
           id,
           first_name,
           last_name,
           email,
           phone,
           status,
           created_at,
           jobs (
             title,
             company
           )
         `)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return data as ApplicationWithJob[];
     },
   });
 
   const statusLabels: Record<string, string> = {
     pending: "Ausstehend",
     reviewed: "Gesichtet",
     accepted: "Angenommen",
     rejected: "Abgelehnt",
   };
 
   const statusColors: Record<string, string> = {
     pending: "bg-yellow-100 text-yellow-800",
     reviewed: "bg-blue-100 text-blue-800",
     accepted: "bg-green-100 text-green-800",
     rejected: "bg-red-100 text-red-800",
   };
 
   return (
     <div className="min-h-screen bg-background py-12">
       <div className="container max-w-6xl">
         <AdminNav />
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Users className="h-5 w-5" />
               Eingegangene Bewerbungen
               {applications && (
                 <Badge variant="secondary" className="ml-2">
                   {applications.length}
                 </Badge>
               )}
             </CardTitle>
           </CardHeader>
           <CardContent>
             {error ? (
               <p className="text-center text-muted-foreground py-8">
                 Fehler beim Laden der Bewerbungen.
               </p>
             ) : isLoading ? (
               <div className="space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <Skeleton key={i} className="h-16 w-full" />
                 ))}
               </div>
             ) : applications && applications.length > 0 ? (
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Bewerber</TableHead>
                       <TableHead>Kontakt</TableHead>
                       <TableHead>Job</TableHead>
                       <TableHead>Datum</TableHead>
                       <TableHead>Status</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {applications.map((app) => (
                       <TableRow key={app.id}>
                         <TableCell className="font-medium">
                           {app.first_name} {app.last_name}
                         </TableCell>
                         <TableCell>
                           <div className="space-y-1">
                             <div className="flex items-center gap-1 text-sm">
                               <Mail className="h-3 w-3 text-muted-foreground" />
                               <a
                                 href={`mailto:${app.email}`}
                                 className="text-primary hover:underline"
                               >
                                 {app.email}
                               </a>
                             </div>
                             {app.phone && (
                               <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                 <Phone className="h-3 w-3" />
                                 {app.phone}
                               </div>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-start gap-1">
                             <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                             <div>
                               <p className="font-medium">{app.jobs?.title || "—"}</p>
                               <p className="text-sm text-muted-foreground">
                                 {app.jobs?.company || "—"}
                               </p>
                             </div>
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-1 text-sm text-muted-foreground">
                             <Calendar className="h-3 w-3" />
                             {app.created_at
                               ? format(new Date(app.created_at), "dd. MMM yyyy", {
                                   locale: de,
                                 })
                               : "—"}
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge
                             className={
                               statusColors[app.status || "pending"] ||
                               statusColors.pending
                             }
                           >
                             {statusLabels[app.status || "pending"] || app.status}
                           </Badge>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             ) : (
               <div className="text-center py-12">
                 <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                 <p className="text-lg text-muted-foreground">
                   Noch keine Bewerbungen eingegangen.
                 </p>
                 <p className="text-sm text-muted-foreground mt-1">
                   Sobald sich jemand bewirbt, erscheinen die Daten hier.
                 </p>
               </div>
             )}
           </CardContent>
         </Card>
      </div>
    </div>
  );
};

const AdminApplications = () => {
  return (
    <AdminAuthGuard>
      <AdminApplicationsContent />
    </AdminAuthGuard>
  );
};

export default AdminApplications;