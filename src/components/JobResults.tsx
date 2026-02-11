import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Building2, Send, Zap, Search, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import ApplyModal from "./ApplyModal";
import { useState, useMemo } from "react";

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

interface JobResultsProps {
  searchFilters: {
    title?: string;
    location?: string;
    employmentType?: string;
  };
}

const employmentTypeLabels: Record<string, string> = {
  vollzeit: "Vollzeit",
  teilzeit: "Teilzeit",
  minijob: "Minijob",
  freelance: "Freelance",
  praktikum: "Praktikum",
};

const employmentTypeBadgeStyles: Record<string, string> = {
  vollzeit: "bg-primary/10 text-primary border-primary/20",
  teilzeit: "bg-featured/10 text-featured border-featured/20",
  minijob: "bg-muted text-muted-foreground border-muted",
  freelance: "bg-accent text-accent-foreground border-accent",
  praktikum: "bg-secondary text-secondary-foreground border-secondary",
};

const JobResults = ({ searchFilters }: JobResultsProps) => {
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null);
  const [localTitleFilter, setLocalTitleFilter] = useState("");
  const [localLocationFilter, setLocalLocationFilter] = useState("");

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ["jobs", searchFilters],
    queryFn: async () => {
      let query = supabase
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
        .order("created_at", { ascending: false });

      if (searchFilters.title) {
        query = query.or(`title.ilike.%${searchFilters.title}%,description.ilike.%${searchFilters.title}%`);
      }

      if (searchFilters.location) {
        query = query.ilike("location", `%${searchFilters.location}%`);
      }

      if (searchFilters.employmentType) {
        query = query.eq("employment_type", searchFilters.employmentType);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data as JobWithCompany[];
    },
  });

  // Local filtering for instant search
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    return jobs.filter((job) => {
      const matchesTitle = !localTitleFilter || 
        job.title.toLowerCase().includes(localTitleFilter.toLowerCase()) ||
        job.description?.toLowerCase().includes(localTitleFilter.toLowerCase());
      
      const matchesLocation = !localLocationFilter ||
        job.location?.toLowerCase().includes(localLocationFilter.toLowerCase());
      
      return matchesTitle && matchesLocation;
    });
  }, [jobs, localTitleFilter, localLocationFilter]);

  if (error) {
    return (
      <section id="job-results" className="py-16 bg-secondary/20">
        <div className="container">
          <p className="text-center text-muted-foreground">
            Fehler beim Laden der Stellenangebote.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="job-results" className="py-16 bg-gradient-to-b from-background to-secondary/30">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {searchFilters.title || searchFilters.location
              ? "Suchergebnisse"
              : "Aktuelle Stellenangebote"}
          </h2>
          <p className="text-muted-foreground text-lg">
            Finden Sie Ihre nächste Karrierechance in der Steuerberatung
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Jobtitel, z.B. Steuerfachangestellte..."
                value={localTitleFilter}
                onChange={(e) => setLocalTitleFilter(e.target.value)}
                className="pl-10 h-12 text-base border-border focus:border-primary"
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Stadt oder Region..."
                value={localLocationFilter}
                onChange={(e) => setLocalLocationFilter(e.target.value)}
                className="pl-10 h-12 text-base border-border focus:border-primary"
              />
            </div>
            <Button className="h-12 px-8 gap-2" size="lg">
              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">Suchen</span>
            </Button>
          </div>
          
          {/* Results count */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                "Lade Stellenangebote..."
              ) : (
                <>
                  <span className="font-semibold text-foreground">{filteredJobs.length}</span> Stellenangebote gefunden
                  {(localTitleFilter || localLocationFilter) && (
                    <button 
                      onClick={() => { setLocalTitleFilter(""); setLocalLocationFilter(""); }}
                      className="ml-2 text-primary hover:underline"
                    >
                      Filter zurücksetzen
                    </button>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Job Cards */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="flex items-center gap-4 p-6">
                  <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-10 w-32 hidden md:block" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="group overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Company Logo */}
                  <div className="hidden md:flex items-center justify-center p-6 bg-secondary/30 border-r border-border">
                    <Avatar className="h-16 w-16 rounded-lg">
                      {job.companies?.logo_url ? (
                        <AvatarImage 
                          src={job.companies.logo_url} 
                          alt={job.companies.name || job.company}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg font-semibold">
                        {(job.companies?.name || job.company).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Job Details */}
                  <div className="flex-1 p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {/* Mobile Logo */}
                        <Avatar className="h-10 w-10 rounded-lg md:hidden">
                          {job.companies?.logo_url ? (
                            <AvatarImage 
                              src={job.companies.logo_url} 
                              alt={job.companies.name || job.company}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                            {(job.companies?.name || job.company).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg md:text-xl group-hover:text-primary transition-colors">
                            {job.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {job.companies?.name || job.company}
                          </p>
                        </div>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {job.employment_type && (
                          <Badge 
                            variant="outline" 
                            className={employmentTypeBadgeStyles[job.employment_type] || ""}
                          >
                            {employmentTypeLabels[job.employment_type] || job.employment_type}
                          </Badge>
                        )}
                        <Badge className="bg-primary text-primary-foreground gap-1">
                          <Zap className="h-3 w-3" />
                          Express
                        </Badge>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary/70" />
                        <span>{job.location || "Remote"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary/70" />
                        <span>
                          {job.created_at && formatDistanceToNow(new Date(job.created_at), {
                            addSuffix: true,
                            locale: de,
                          })}
                        </span>
                      </div>
                      {job.salary_min && job.salary_max && (
                        <span className="font-medium text-foreground">
                          {job.salary_min.toLocaleString("de-DE")} – {job.salary_max.toLocaleString("de-DE")} € / Jahr
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex md:flex-col items-center justify-center gap-3 p-5 md:p-6 border-t md:border-t-0 md:border-l border-border bg-secondary/20">
                    <Button 
                      className="w-full md:w-auto gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                      }}
                    >
                      <Send className="h-4 w-4" />
                      Jetzt bewerben
                    </Button>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-primary" />
                      Nur 30 Sekunden
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Keine Stellenangebote gefunden
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Versuchen Sie es mit anderen Suchbegriffen oder schauen Sie später wieder vorbei.
            </p>
            {(localTitleFilter || localLocationFilter) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setLocalTitleFilter(""); setLocalLocationFilter(""); }}
              >
                Filter zurücksetzen
              </Button>
            )}
          </div>
        )}
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
    </section>
  );
};

export default JobResults;
