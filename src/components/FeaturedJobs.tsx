import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Star, Building2, Send, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import ApplyModal from "./ApplyModal";
import { useState } from "react";

interface JobWithCompany {
  id: string;
  title: string;
  company: string;
  company_id: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string | null;
  is_active: boolean | null;
  companies: {
    name: string;
    logo_url: string | null;
  } | null;
}

const employmentTypeLabels: Record<string, string> = {
  vollzeit: "Vollzeit",
  teilzeit: "Teilzeit",
  freelance: "Freelance",
  praktikum: "Praktikum",
};

const FeaturedJobs = () => {
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null);

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ["featured-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          company,
          company_id,
          location,
          employment_type,
          description,
          salary_min,
          salary_max,
          created_at,
          is_active,
          companies (
            name,
            logo_url
          )
        `)
        .eq("is_active", true)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as JobWithCompany[];
    },
  });

  if (error) {
    return (
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <p className="text-center text-muted-foreground">
            Fehler beim Laden der Featured Jobs.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-featured fill-featured" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Featured Jobs
              </h2>
            </div>
            <p className="text-muted-foreground">
              Ausgewählte Top-Stellenangebote von führenden Kanzleien
            </p>
          </div>
          <Button variant="outline" className="hidden md:flex">
            Alle anzeigen
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary relative"
              >
                {/* Express Badge */}
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                  <Zap className="h-3 w-3" />
                  30 Sek. Bewerbung
                </div>
                <CardHeader className="pb-3 pt-10">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {job.title}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {job.employment_type ? employmentTypeLabels[job.employment_type] : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {job.companies?.logo_url ? (
                      <Avatar className="h-5 w-5 border border-border">
                        <AvatarImage src={job.companies.logo_url} alt={job.companies.name || job.company} />
                        <AvatarFallback className="text-[10px]">
                          {(job.companies.name || job.company).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                    <span>{job.companies?.name || job.company}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(job.created_at), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </span>
                    </div>
                  </div>
                  {job.salary_min && job.salary_max && (
                    <p className="text-sm font-medium text-primary">
                      {job.salary_min.toLocaleString("de-DE")} € -{" "}
                      {job.salary_max.toLocaleString("de-DE")} € / Jahr
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex flex-col gap-2 mt-3">
                    <Button 
                      className="w-full"
                      onClick={() => setSelectedJob(job)}
                    >
                      <Send className="h-4 w-4" />
                      Jetzt bewerben
                    </Button>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" />
                      <span>Nur 30 Sek.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Keine Featured Jobs verfügbar.
            </p>
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline">Alle Featured Jobs anzeigen</Button>
        </div>
         
         {selectedJob && (
           <ApplyModal
             open={!!selectedJob}
             onOpenChange={(open) => !open && setSelectedJob(null)}
             jobId={selectedJob.id}
             jobTitle={selectedJob.title}
             company={selectedJob.company}
             companyId={selectedJob.company_id}
           />
         )}
      </div>
    </section>
  );
};

export default FeaturedJobs;
