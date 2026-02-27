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
import { Mail, Phone, Linkedin, Calendar, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import neeleImage from "@/assets/neele-ehlers.jpg";

interface NeeleContactDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NeeleContactDrawer = ({ open, onOpenChange }: NeeleContactDrawerProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: "Nachricht gesendet!", description: "Neele meldet sich in Kürze bei Ihnen." });
      setForm({ name: "", email: "", message: "" });
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
          <a
            href="mailto:neele@kanzleistelle24.de"
            className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm"
          >
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-foreground">E-Mail</span>
          </a>
          <a
            href="tel:+4940123456789"
            className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm"
          >
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-foreground">Anrufen</span>
          </a>
          <a
            href="https://www.linkedin.com/in/neele-ehlers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm"
          >
            <Linkedin className="h-4 w-4 text-primary" />
            <span className="text-foreground">LinkedIn</span>
          </a>
          <a
            href="https://calendly.com/neele-ehlers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-sm"
          >
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-foreground">Termin buchen</span>
          </a>
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Oder schreiben Sie mir direkt:</h3>
          <div>
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ihr Name"
              required
            />
          </div>
          <div>
            <Label htmlFor="contact-email">E-Mail</Label>
            <Input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ihre@email.de"
              required
            />
          </div>
          <div>
            <Label htmlFor="contact-message">Nachricht</Label>
            <Textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Wie kann ich Ihnen helfen?"
              rows={4}
              required
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
      </SheetContent>
    </Sheet>
  );
};

export default NeeleContactDrawer;
