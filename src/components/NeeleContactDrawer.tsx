import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Linkedin, Calendar, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import neeleImage from "@/assets/neele-ehlers.jpg";

interface NeeleContactDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NeeleContactDrawer = ({ open, onOpenChange }: NeeleContactDrawerProps) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const { error } = await supabase.from("contact_leads").insert({
      full_name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim(),
      source_url: window.location.pathname,
    });

    setSending(false);

    if (error) {
      toast.error("Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.");
      return;
    }

    setSent(true);
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setSent(false);
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <div className="flex items-center gap-4 mb-2">
            <img
              src={neeleImage}
              alt="Neele Ehlers"
              className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-primary/20"
            />
            <div>
              <SheetTitle className="text-xl">Neele Ehlers</SheetTitle>
              <SheetDescription className="text-sm">
                Recruiting Managerin
              </SheetDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Ich helfe Ihnen gerne bei Fragen rund um Ihre Karriere in der Steuerbranche oder bei der Suche nach den passenden Talenten.
          </p>
        </SheetHeader>

        {/* Direct contact options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a href="mailto:neele@kanzleistelle24.de" className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-foreground">E-Mail</span>
          </a>
          <a href="tel:+4940123456789" className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-foreground">Anrufen</span>
          </a>
          <a href="https://www.linkedin.com/in/neele-ehlers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm">
            <Linkedin className="h-4 w-4 text-primary" />
            <span className="text-foreground">LinkedIn</span>
          </a>
          <a href="https://calendly.com/neele-ehlers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-foreground">Termin buchen</span>
          </a>
        </div>

        {/* Success state */}
        {sent ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">Vielen Dank!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Neele Ehlers wird sich in Kürze bei Ihnen melden.
              </p>
            </div>
            <Button variant="outline" onClick={() => handleClose(false)} className="mt-2">
              Schließen
            </Button>
          </div>
        ) : (
          /* Contact form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Oder schreiben Sie mir direkt:</h3>
            <div>
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ihr Name"
                required
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="contact-email">E-Mail *</Label>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ihre@email.de"
                required
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Telefon (optional)</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+49 ..."
                maxLength={30}
              />
            </div>
            <div>
              <Label htmlFor="contact-message">Nachricht *</Label>
              <Textarea
                id="contact-message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Wie kann ich Ihnen helfen?"
                rows={4}
                required
                maxLength={1000}
              />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Wird gesendet..." : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Nachricht senden
                </>
              )}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NeeleContactDrawer;
