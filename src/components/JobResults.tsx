import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Building2, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

interface JobResultsProps {
  searchFilters: {
    title?: string;
    location?: string;
  };
}

const employmentTypeLabels: Record<string, string> = {
  vollzeit: "Vollzeit",
  teilzeit: "Teilzeit",
  freelance: "Freelance",
  praktikum: "Praktikum",
};

const JobResults = ({ searchFilters }: JobResultsProps) => {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ["jobs", searchFilters],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (searchFilters.title) {
        query = query.ilike("title", `%${searchFilters.title}%`);
      }

      if (searchFilters.location) {
        query = query.ilike("location", `%${searchFilters.location}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data;
    },
  });

  if (error) {
    return (
      <section id="job-results" className="py-16">
        <div className="container">
          <p className="text-center text-muted-foreground">
            Fehler beim Laden der Stellenangebote.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="job-results" className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {searchFilters.title || searchFilters.location
                ? "Suchergebnisse"
                : "Aktuelle Stellenangebote"}
            </h2>
            <p className="text-muted-foreground">
              {isLoading
                ? "Lade Stellenangebote..."
                : jobs
                ? `${jobs.length} Stellenangebote gefunden`
                : "Keine Ergebnisse"}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
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
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex-1">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <Badge variant="secondary">
                          {job.employment_type ? employmentTypeLabels[job.employment_type] : "N/A"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{job.company}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
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
                        {job.salary_min && job.salary_max && (
                          <span className="font-medium text-primary">
                            {job.salary_min.toLocaleString("de-DE")} € -{" "}
                            {job.salary_max.toLocaleString("de-DE")} € / Jahr
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                    </CardContent>
                  </div>
                  <div className="px-6 pb-4 md:pb-0 md:pr-6">
                    <Button className="w-full md:w-auto">
                      Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <p className="text-lg text-muted-foreground mb-4">
              Keine Stellenangebote gefunden.
            </p>
            <p className="text-sm text-muted-foreground">
              Versuchen Sie es mit anderen Suchbegriffen oder schauen Sie später wieder vorbei.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobResults;
