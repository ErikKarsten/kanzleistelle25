import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2, ArrowRight } from "lucide-react";

interface EmployerOnboardingProps {
  userId: string;
}

const EmployerOnboarding = ({ userId }: EmployerOnboardingProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.name.trim()) {
        throw new Error("Bitte geben Sie einen Kanzleinamen ein.");
      }

      const { data: company, error } = await supabase
        .from("companies")
        .insert({
          name: data.name.trim(),
          location: data.location.trim() || null,
          description: data.description.trim() || null,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-company"] });
      toast({ 
        title: "Kanzlei-Profil erstellt!", 
        description: "Sie können jetzt Stellenanzeigen erstellen." 
      });
      // Reload to trigger auth state refresh
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Profil konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCompanyMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Willkommen bei Kanzleistelle24!</CardTitle>
        <CardDescription className="text-base">
          Bitte vervollständigen Sie Ihr Kanzlei-Profil, um Stellenanzeigen zu schalten.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name Ihrer Kanzlei *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Musterkanzlei GmbH"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Standort</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="z.B. München"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Kurze Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Erzählen Sie potenziellen Bewerbern etwas über Ihre Kanzlei..."
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={createCompanyMutation.isPending}
          >
            {createCompanyMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Wird erstellt...
              </>
            ) : (
              <>
                Profil erstellen
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmployerOnboarding;
