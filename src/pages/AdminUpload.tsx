import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
 import { Loader2, Upload } from "lucide-react";
 import AdminNav from "@/components/AdminNav";

const AdminUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    employment_type: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.company) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie mindestens Titel und Firma aus.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("jobs").insert({
        title: formData.title,
        company: formData.company,
        location: formData.location || null,
        description: formData.description || null,
        employment_type: formData.employment_type || null,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Erfolg!",
        description: "Der Job wurde erfolgreich hochgeladen.",
      });

      // Reset form
      setFormData({
        title: "",
        company: "",
        location: "",
        description: "",
        employment_type: "",
      });
    } catch (error: any) {
      console.error("Error uploading job:", error);
      toast({
        title: "Fehler beim Hochladen",
        description: error.message || "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl">
         <AdminNav />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Neuen Job hochladen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Jobtitel *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="z.B. Rechtsanwalt (m/w/d) Arbeitsrecht"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Firma / Kanzlei *</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="z.B. Müller & Partner Rechtsanwälte"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Standort</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="z.B. München, Bayern"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">Beschäftigungsart</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, employment_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Beschäftigungsart wählen" />
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
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Beschreiben Sie die Stelle, Anforderungen und Benefits..."
                  rows={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird hochgeladen...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Job hochladen
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUpload;
