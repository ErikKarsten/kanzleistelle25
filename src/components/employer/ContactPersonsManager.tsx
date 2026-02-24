import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  UserPlus,
  Trash2,
  Loader2,
  Star,
  Phone,
  Mail,
  Save,
  AlertTriangle,
} from "lucide-react";

interface ContactPersonsManagerProps {
  companyId: string;
}

interface ContactPerson {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email: string;
  role: string | null;
  is_primary: boolean;
  created_at: string | null;
}

const ContactPersonsManager = ({ companyId }: ContactPersonsManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "", role: "" });
  const [showForm, setShowForm] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<{ id: string; name: string; hasJobs: boolean } | null>(null);

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contact-persons", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_persons")
        .select("*")
        .eq("company_id", companyId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ContactPerson[];
    },
    enabled: !!companyId,
  });

  // Add contact
  const addMutation = useMutation({
    mutationFn: async (contact: typeof newContact) => {
      const isFirst = !contacts || contacts.length === 0;
      const { error } = await supabase.from("contact_persons").insert({
        company_id: companyId,
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        role: contact.role.trim() || "Ansprechpartner",
        is_primary: isFirst,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-persons", companyId] });
      setNewContact({ name: "", phone: "", email: "", role: "" });
      setShowForm(false);
      toast({ title: "Ansprechpartner hinzugefügt" });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Delete contact
  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from("contact_persons")
        .delete()
        .eq("id", contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-persons", companyId] });
      setDeleteWarning(null);
      toast({ title: "Ansprechpartner entfernt" });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Set primary
  const setPrimaryMutation = useMutation({
    mutationFn: async (contactId: string) => {
      // Unset all
      await supabase
        .from("contact_persons")
        .update({ is_primary: false })
        .eq("company_id", companyId);
      // Set new primary
      const { error } = await supabase
        .from("contact_persons")
        .update({ is_primary: true })
        .eq("id", contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-persons", companyId] });
      toast({ title: "Hauptkontakt aktualisiert" });
    },
  });

  const handleDeleteCheck = async (contact: ContactPerson) => {
    // Check if linked to active jobs
    const { data: linkedJobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("contact_person_id", contact.id)
      .eq("is_active", true);

    setDeleteWarning({
      id: contact.id,
      name: contact.name,
      hasJobs: (linkedJobs?.length || 0) > 0,
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim() || !newContact.email.trim()) {
      toast({ title: "Bitte alle Pflichtfelder ausfüllen", variant: "destructive" });
      return;
    }
    addMutation.mutate(newContact);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ansprechpartner</CardTitle>
        <CardDescription>
          Verwalten Sie die Kontaktpersonen Ihrer Kanzlei für Stellenanzeigen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : contacts && contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">{contact.name}</p>
                    {contact.is_primary && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        <Star className="h-3 w-3 mr-0.5 fill-current" />
                        Hauptkontakt
                      </Badge>
                    )}
                    {contact.role && contact.role !== "Ansprechpartner" && (
                      <Badge variant="secondary" className="text-xs">{contact.role}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  {!contact.is_primary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setPrimaryMutation.mutate(contact.id)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Hauptkontakt
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCheck(contact)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine Ansprechpartner angelegt.
          </p>
        )}

        {/* Add form */}
        {showForm ? (
          <form onSubmit={handleAdd} className="space-y-4 p-4 rounded-lg border border-dashed bg-secondary/30">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Max Mustermann"
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rolle (optional)</Label>
                <Input
                  value={newContact.role}
                  onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                  placeholder="z.B. Personalleitung"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">E-Mail *</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="kontakt@kanzlei.de"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefon *</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+49 123 456789"
                  required
                  maxLength={30}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Speichern
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Ansprechpartner hinzufügen
          </Button>
        )}

        {/* Delete warning dialog */}
        <AlertDialog open={!!deleteWarning} onOpenChange={(o) => !o && setDeleteWarning(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteWarning?.hasJobs ? (
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Achtung: Verknüpfte Stellen
                  </span>
                ) : (
                  "Ansprechpartner löschen?"
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteWarning?.hasJobs
                  ? `„${deleteWarning.name}" ist noch mit aktiven Stellenanzeigen verknüpft. Beim Löschen wird die Verknüpfung aufgehoben (Ansprechpartner wird auf der Stelle nicht mehr angezeigt).`
                  : `Möchten Sie „${deleteWarning?.name}" wirklich entfernen?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteWarning && deleteMutation.mutate(deleteWarning.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Trotzdem löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default ContactPersonsManager;
