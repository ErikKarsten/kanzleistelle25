import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldOff, Send, CheckCircle2, LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface CompanyBlockedScreenProps {
  companyId: string;
  companyName: string;
  alreadyRequested: boolean;
}

const CompanyBlockedScreen = ({ companyId, companyName, alreadyRequested }: CompanyBlockedScreenProps) => {
  const [requested, setRequested] = useState(alreadyRequested);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const requestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("companies")
        .update({
          reactivation_requested: true,
          reactivation_requested_at: new Date().toISOString(),
        } as any)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      setRequested(true);
    },
  });

  const handleLogout = async () => {
    await signOut();
    queryClient.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-secondary/20 py-12 px-4">
        <Card className="max-w-lg w-full border-none shadow-xl">
          <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <ShieldOff className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Ihr Konto ist aktuell deaktiviert
              </h1>
              <p className="text-muted-foreground">
                Die Kanzlei <span className="font-semibold">{companyName}</span> wurde vom Administrator deaktiviert. 
                Ihre Stellenanzeigen sind derzeit nicht sichtbar.
              </p>
            </div>

            {requested ? (
              <div className="flex items-center gap-2 justify-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>
                  Ihre Reaktivierungsanfrage wurde gesendet. Wir melden uns in Kürze bei Ihnen.
                </span>
              </div>
            ) : (
              <Button
                onClick={() => requestMutation.mutate()}
                disabled={requestMutation.isPending}
                className="gap-2"
                size="lg"
              >
                {requestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Reaktivierung anfragen
              </Button>
            )}

            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground gap-2">
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyBlockedScreen;
