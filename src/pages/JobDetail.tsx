import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplyModal from "@/components/ApplyModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Clock,
  Building2,
  Send,
  Zap,
  Briefcase,
  ChevronLeft,
  Globe,
  CheckCircle2,
  Star,
  Phone,
  User,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";

const employmentTypeLabels: Record<string, string> = {
  vollzeit: "Vollzeit",
  teilzeit: "Teilzeit",
  minijob: "Minijob",
  freelance: "Freelance",
  praktikum: "Praktikum",
};

const workingModelLabels: Record<string, string> = {
  vor_ort: "Vor Ort",
  hybrid: "Hybrid",
  remote: "Remote",
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [applyOpen, setApplyOpen] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job-detail", id],
    queryFn: async () => {
      if (!id) throw new Error("Keine Job-ID");
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          companies!inner (
            name,
            logo_url,
            location,
            description,
            website,
            is_active
          ),
          contact_persons (
            name,
            phone,
            email,
            role
          )
        `)
        .eq("id", id)
        .eq("is_active", true)
        .eq("status", "published")
        .eq("companies.is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-secondary/20 py-8">
          <div className="container max-w-4xl">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-40 w-full" />
              </div>
              <div>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-secondary/20">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Stelle nicht gefunden</h1>
            <p className="text-muted-foreground">Diese Stellenanzeige existiert nicht oder ist nicht mehr aktiv.</p>
            <Button asChild variant="outline">
              <Link to="/">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Zurück zu allen Stellen
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const companyName = job.companies?.name || job.company;
  const companyInitials = companyName.substring(0, 2).toUpperCase();
  const requirements = job.requirements
    ? (() => {
        try {
          const parsed = JSON.parse(job.requirements);
          return Array.isArray(parsed) ? parsed : job.requirements.split("\n").filter(Boolean);
        } catch {
          return job.requirements.split("\n").filter(Boolean);
        }
      })()
    : [];
  const benefits = Array.isArray(job.benefits) ? job.benefits : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-secondary/20">
        {/* Breadcrumb */}
        <div className="bg-background border-b border-border">
          <div className="container max-w-4xl py-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Alle Stellenangebote
            </Link>
          </div>
        </div>

        <div className="container max-w-4xl py-8">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                  {job.companies?.logo_url ? (
                    <img
                      src={job.companies.logo_url}
                      alt={companyName}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-xl md:text-2xl font-bold" style={{ color: "#D4AF37" }}>
                      {companyInitials}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{job.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{companyName}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {job.employment_type && (
                      <Badge variant="secondary">
                        {employmentTypeLabels[job.employment_type] || job.employment_type}
                      </Badge>
                    )}
                    {job.working_model && (
                      <Badge variant="outline">
                        {workingModelLabels[job.working_model] || job.working_model}
                      </Badge>
                    )}
                    {job.location && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    )}
                    {job.created_at && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: de })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Salary */}
              {(job.salary_range || (job.salary_min && job.salary_max)) && (
                <Card>
                  <CardContent className="py-4">
                    <p className="text-lg font-semibold text-primary">
                      💰{" "}
                      {job.salary_range ||
                        `${job.salary_min?.toLocaleString("de-DE")} – ${job.salary_max?.toLocaleString("de-DE")} € / Jahr`}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {job.description && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Stellenbeschreibung</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                    {job.description}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {requirements.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">Anforderungen</h2>
                  <div className="flex flex-wrap gap-2">
                    {requirements.map((req: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {benefits.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">Benefits</h2>
                  <div className="flex flex-wrap gap-2">
                    {benefits.map((b: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border bg-secondary/50 text-foreground"
                      >
                        <Star className="h-3.5 w-3.5 text-featured fill-featured" />
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Apply CTA */}
              <Card className="border-primary/20 shadow-md">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                      <Zap className="h-3 w-3" />
                      Express-Bewerbung
                    </div>
                    <h3 className="font-semibold text-foreground">In 30 Sekunden bewerben</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ohne Anschreiben, ohne Lebenslauf
                    </p>
                  </div>
                  <Button className="w-full gap-2" size="lg" onClick={() => setApplyOpen(true)}>
                    <Send className="h-4 w-4" />
                    Jetzt bewerben
                  </Button>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                      {job.companies?.logo_url ? (
                        <img
                          src={job.companies.logo_url}
                          alt={companyName}
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: "#D4AF37" }}>
                          {companyInitials}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{companyName}</h3>
                      {job.companies?.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.companies.location}
                        </p>
                      )}
                    </div>
                  </div>
                  {job.companies?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {job.companies.description}
                    </p>
                  )}
                  {job.companies?.website && (
                    <a
                      href={job.companies.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website besuchen
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Contact Person */}
              {job.contact_persons && (
                <Card className="border-primary/20">
                  <CardContent className="pt-6 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Ihre Ansprechperson
                    </h3>
                    <p className="font-medium text-foreground">{job.contact_persons.name}</p>
                    {job.contact_persons.role && job.contact_persons.role !== "Ansprechpartner" && (
                      <p className="text-xs text-muted-foreground">{job.contact_persons.role}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${job.contact_persons.phone}`} className="hover:text-primary transition-colors">
                        {job.contact_persons.phone}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Meta */}
              <Card>
                <CardContent className="pt-6">
                  <dl className="space-y-3 text-sm">
                    {job.employment_type && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Anstellung</dt>
                        <dd className="font-medium text-foreground">
                          {employmentTypeLabels[job.employment_type] || job.employment_type}
                        </dd>
                      </div>
                    )}
                    {job.working_model && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Arbeitsmodell</dt>
                        <dd className="font-medium text-foreground">
                          {workingModelLabels[job.working_model] || job.working_model}
                        </dd>
                      </div>
                    )}
                    {job.location && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Standort</dt>
                        <dd className="font-medium text-foreground">{job.location}</dd>
                      </div>
                    )}
                    {job.created_at && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Veröffentlicht</dt>
                        <dd className="font-medium text-foreground">
                          {format(new Date(job.created_at), "dd. MMM yyyy", { locale: de })}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ApplyModal
        open={applyOpen}
        onOpenChange={setApplyOpen}
        jobId={job.id}
        jobTitle={job.title}
        company={companyName}
        companyId={job.company_id}
      />
    </div>
  );
};

export default JobDetail;
