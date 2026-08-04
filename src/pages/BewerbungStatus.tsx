import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileSearch, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface StatusData {
  first_name: string | null;
  status: string | null;
  created_at: string | null;
  position: string | null;
  applicant_role: string | null;
  applicant_role_other: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Eingegangen", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  reviewing: { label: "In Prüfung", className: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: FileSearch },
  interview: { label: "Einladung zum Gespräch", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  accepted: { label: "Angenommen", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Abgesagt", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  withdrawn: { label: "Zurückgezogen", className: "bg-muted text-muted-foreground border-border", icon: XCircle },
};

const ROLE_LABELS: Record<string, string> = {
  steuerfachangestellte: "Steuerfachangestellte*r",
  steuerberater: "Steuerberater*in",
  bilanzbuchhalter: "Finanz/Bilanzbuchhalter*in",
  lohnbuchhalter: "Lohnbuchhalter*in",
  steuerfachwirt: "Steuerfachwirt*in",
  sonstige: "Sonstige",
};

const BewerbungStatus = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Kein gültiger Link. Bitte nutze den Link aus deiner Bestätigungs-E-Mail.");
      setLoading(false);
      return;
    }

    supabase.functions
      .invoke("get-application-status", { body: { token } })
      .then(({ data: result, error: fnError }) => {
        if (fnError || result?.error) {
          setError(result?.error || "Bewerbung konnte nicht gefunden werden.");
        } else {
          setData(result);
        }
      })
      .catch(() => setError("Bewerbung konnte nicht geladen werden. Bitte versuche es später erneut."))
      .finally(() => setLoading(false));
  }, [token]);

  const statusInfo = data?.status ? STATUS_CONFIG[data.status] : null;
  const StatusIcon = statusInfo?.icon ?? Clock;
  const roleLabel = data?.applicant_role
    ? data.applicant_role === "sonstige" && data.applicant_role_other
      ? `${ROLE_LABELS[data.applicant_role] ?? data.applicant_role}: ${data.applicant_role_other}`
      : ROLE_LABELS[data.applicant_role] ?? data.applicant_role
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 bg-secondary/20">
        <div className="container">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileSearch className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Dein Bewerbungsstatus</CardTitle>
              <CardDescription>
                Hier siehst du jederzeit den aktuellen Stand deiner Bewerbung.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading && (
                <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Status wird geladen…</p>
                </div>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" asChild className="mt-2">
                    <a href="mailto:info@kanzleistelle24.de">Support kontaktieren</a>
                  </Button>
                </div>
              )}

              {!loading && !error && data && (
                <>
                  <p className="text-center text-foreground">
                    Hallo {data.first_name || ""}, danke für deine Bewerbung
                    {data.position ? (
                      <>
                        {" "}
                        als <strong>{data.position}</strong>
                      </>
                    ) : null}
                    !
                  </p>

                  <div className="flex flex-col items-center gap-2 py-4">
                    <Badge variant="outline" className={`text-sm px-4 py-1.5 gap-2 ${statusInfo?.className ?? ""}`}>
                      <StatusIcon className="h-4 w-4" />
                      {statusInfo?.label ?? data.status ?? "Unbekannt"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
                    {data.created_at && (
                      <p>
                        Eingegangen am{" "}
                        <span className="text-foreground font-medium">
                          {format(new Date(data.created_at), "dd. MMMM yyyy", { locale: de })}
                        </span>
                      </p>
                    )}
                    {roleLabel && (
                      <p>
                        Rolle: <span className="text-foreground font-medium">{roleLabel}</span>
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-center text-muted-foreground pt-2">
                    Fragen zu deiner Bewerbung? Schreib uns an{" "}
                    <a href="mailto:info@kanzleistelle24.de" className="text-primary hover:underline">
                      info@kanzleistelle24.de
                    </a>
                    .
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BewerbungStatus;
