import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Users,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import AdminNav from "@/components/AdminNav";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import type { Tables } from "@/integrations/supabase/types";
 
 type Job = Tables<"jobs">;
 
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
 
 const employmentTypeLabels: Record<string, string> = {
   vollzeit: "Vollzeit",
   teilzeit: "Teilzeit",
   freelance: "Freelance",
   praktikum: "Praktikum",
 };
 
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
 
const AdminDashboardContent = () => {
  const queryClient = useQueryClient();
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
 
   // Fetch jobs
   const { data: jobs, isLoading: jobsLoading } = useQuery({
     queryKey: ["admin-jobs"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("jobs")
         .select("*")
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
 
   // Fetch applications
   const { data: applications, isLoading: applicationsLoading } = useQuery({
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
 
   // Delete job mutation
   const deleteJobMutation = useMutation({
     mutationFn: async (jobId: string) => {
       const { error } = await supabase.from("jobs").delete().eq("id", jobId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
       queryClient.invalidateQueries({ queryKey: ["jobs"] });
       queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
       toast({ title: "Job gelöscht", description: "Der Job wurde erfolgreich entfernt." });
       setDeletingJob(null);
     },
     onError: (error) => {
       console.error("Delete error:", error);
       toast({
         title: "Fehler",
         description: "Der Job konnte nicht gelöscht werden.",
         variant: "destructive",
       });
     },
   });
 
   // Update job mutation
   const updateJobMutation = useMutation({
     mutationFn: async (job: Partial<Job> & { id: string }) => {
       const { error } = await supabase
         .from("jobs")
         .update({
           title: job.title,
           company: job.company,
           location: job.location,
           description: job.description,
           employment_type: job.employment_type,
           is_active: job.is_active,
         })
         .eq("id", job.id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
       queryClient.invalidateQueries({ queryKey: ["jobs"] });
       queryClient.invalidateQueries({ queryKey: ["featured-jobs"] });
       toast({ title: "Gespeichert", description: "Die Änderungen wurden übernommen." });
       setEditingJob(null);
     },
     onError: (error) => {
       console.error("Update error:", error);
       toast({
         title: "Fehler",
         description: "Der Job konnte nicht aktualisiert werden.",
         variant: "destructive",
       });
     },
   });
 
   return (
     <div className="min-h-screen bg-background py-12">
       <div className="container max-w-6xl">
         <AdminNav />
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <LayoutDashboard className="h-5 w-5" />
               Admin Dashboard
             </CardTitle>
           </CardHeader>
           <CardContent>
             <Tabs defaultValue="jobs" className="w-full">
               <TabsList className="grid w-full grid-cols-2 mb-6">
                 <TabsTrigger value="jobs" className="flex items-center gap-2">
                   <Briefcase className="h-4 w-4" />
                   Jobs
                   {jobs && <Badge variant="secondary">{jobs.length}</Badge>}
                 </TabsTrigger>
                 <TabsTrigger value="applications" className="flex items-center gap-2">
                   <Users className="h-4 w-4" />
                   Bewerbungen
                   {applications && <Badge variant="secondary">{applications.length}</Badge>}
                 </TabsTrigger>
               </TabsList>
 
               {/* JOBS TAB */}
               <TabsContent value="jobs">
                 {jobsLoading ? (
                   <div className="space-y-4">
                     {[...Array(5)].map((_, i) => (
                       <Skeleton key={i} className="h-16 w-full" />
                     ))}
                   </div>
                 ) : jobs && jobs.length > 0 ? (
                   <div className="overflow-x-auto">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Titel</TableHead>
                           <TableHead>Firma</TableHead>
                           <TableHead>Standort</TableHead>
                           <TableHead>Typ</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead className="text-right">Aktionen</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {jobs.map((job) => (
                           <TableRow key={job.id}>
                             <TableCell className="font-medium">{job.title}</TableCell>
                             <TableCell>{job.company}</TableCell>
                             <TableCell>
                               <div className="flex items-center gap-1 text-muted-foreground">
                                 <MapPin className="h-3 w-3" />
                                 {job.location || "—"}
                               </div>
                             </TableCell>
                             <TableCell>
                               {job.employment_type
                                 ? employmentTypeLabels[job.employment_type]
                                 : "—"}
                             </TableCell>
                             <TableCell>
                               <Badge variant={job.is_active ? "default" : "secondary"}>
                                 {job.is_active ? "Aktiv" : "Inaktiv"}
                               </Badge>
                             </TableCell>
                             <TableCell className="text-right">
                               <div className="flex justify-end gap-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => setEditingJob(job)}
                                 >
                                   <Pencil className="h-4 w-4" />
                                 </Button>
                                 <Button
                                   variant="destructive"
                                   size="sm"
                                   onClick={() => setDeletingJob(job)}
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </div>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                 ) : (
                   <div className="text-center py-12">
                     <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                     <p className="text-lg text-muted-foreground">Keine Jobs vorhanden.</p>
                   </div>
                 )}
               </TabsContent>
 
               {/* APPLICATIONS TAB */}
               <TabsContent value="applications">
                 {applicationsLoading ? (
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
                               <div>
                                 <p className="font-medium">{app.jobs?.title || "—"}</p>
                                 <p className="text-sm text-muted-foreground">
                                   {app.jobs?.company || "—"}
                                 </p>
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
                   </div>
                 )}
               </TabsContent>
             </Tabs>
           </CardContent>
         </Card>
 
         {/* EDIT JOB DIALOG */}
         <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
           <DialogContent className="sm:max-w-lg">
             <DialogHeader>
               <DialogTitle>Job bearbeiten</DialogTitle>
               <DialogDescription>
                 Passen Sie die Stellenanzeige an.
               </DialogDescription>
             </DialogHeader>
             {editingJob && (
               <form
                 onSubmit={(e) => {
                   e.preventDefault();
                   updateJobMutation.mutate(editingJob);
                 }}
                 className="space-y-4"
               >
                 <div className="space-y-2">
                   <Label>Jobtitel</Label>
                   <Input
                     value={editingJob.title}
                     onChange={(e) =>
                       setEditingJob({ ...editingJob, title: e.target.value })
                     }
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Firma</Label>
                   <Input
                     value={editingJob.company}
                     onChange={(e) =>
                       setEditingJob({ ...editingJob, company: e.target.value })
                     }
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Standort</Label>
                   <Input
                     value={editingJob.location || ""}
                     onChange={(e) =>
                       setEditingJob({ ...editingJob, location: e.target.value })
                     }
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Beschäftigungsart</Label>
                   <Select
                     value={editingJob.employment_type || ""}
                     onValueChange={(value) =>
                       setEditingJob({ ...editingJob, employment_type: value })
                     }
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Auswählen" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="vollzeit">Vollzeit</SelectItem>
                       <SelectItem value="teilzeit">Teilzeit</SelectItem>
                       <SelectItem value="freelance">Freelance</SelectItem>
                       <SelectItem value="praktikum">Praktikum</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label>Beschreibung</Label>
                   <Textarea
                     value={editingJob.description || ""}
                     onChange={(e) =>
                       setEditingJob({ ...editingJob, description: e.target.value })
                     }
                     rows={4}
                   />
                 </div>
                 <div className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     id="is_active"
                     checked={editingJob.is_active ?? true}
                     onChange={(e) =>
                       setEditingJob({ ...editingJob, is_active: e.target.checked })
                     }
                     className="h-4 w-4"
                   />
                   <Label htmlFor="is_active">Job ist aktiv</Label>
                 </div>
                 <DialogFooter>
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => setEditingJob(null)}
                   >
                     Abbrechen
                   </Button>
                   <Button type="submit" disabled={updateJobMutation.isPending}>
                     {updateJobMutation.isPending && (
                       <Loader2 className="h-4 w-4 animate-spin" />
                     )}
                     Speichern
                   </Button>
                 </DialogFooter>
               </form>
             )}
           </DialogContent>
         </Dialog>
 
         {/* DELETE CONFIRMATION DIALOG */}
         <Dialog open={!!deletingJob} onOpenChange={(open) => !open && setDeletingJob(null)}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Job löschen?</DialogTitle>
               <DialogDescription>
                 Möchten Sie "{deletingJob?.title}" wirklich löschen? Diese Aktion kann
                 nicht rückgängig gemacht werden.
               </DialogDescription>
             </DialogHeader>
             <DialogFooter>
               <Button variant="outline" onClick={() => setDeletingJob(null)}>
                 Abbrechen
               </Button>
               <Button
                 variant="destructive"
                 onClick={() => deletingJob && deleteJobMutation.mutate(deletingJob.id)}
                 disabled={deleteJobMutation.isPending}
               >
                 {deleteJobMutation.isPending && (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 )}
                 Löschen
               </Button>
             </DialogFooter>
           </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <AdminAuthGuard>
      <AdminDashboardContent />
    </AdminAuthGuard>
  );
};

export default AdminDashboard;