import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  Building2,
  Briefcase,
  AlertTriangle,
} from "lucide-react";

const painPoints = [
  {
    icon: AlertTriangle,
    title: "Fachkräftemangel",
    description:
      "Die Steuerbranche leidet unter einem massiven Fachkräftemangel. Qualifizierte Bewerber sind rar.",
  },
  {
    icon: Clock,
    title: "Zeitaufwändige Suche",
    description:
      "Traditionelle Recruiting-Methoden kosten Zeit und Ressourcen, die in der Mandantenarbeit fehlen.",
  },
  {
    icon: Users,
    title: "Hohe Fluktuation",
    description:
      "Unpassende Einstellungen führen zu teuren Fehlbesetzungen und hoher Mitarbeiterfluktuation.",
  },
];

const solutions = [
  {
    icon: Building2,
    title: "Branchenfokus Steuer",
    description: "Wir sind auf die Steuerbranche spezialisiert und verstehen Ihre Anforderungen.",
  },
  {
    icon: Award,
    title: "Geprüfte Kandidaten",
    description: "Jeder Kandidat wird persönlich geprüft und auf Ihre Kanzleikultur abgestimmt.",
  },
  {
    icon: TrendingUp,
    title: "Schnelle Besetzung",
    description: "Unser Express-Prozess liefert passende Kandidaten in kürzester Zeit.",
  },
];

const FuerArbeitgeber = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    positions: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Anfrage gesendet!",
      description: "Wir melden uns innerhalb von 24 Stunden bei Ihnen.",
    });

    setFormData({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      positions: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-background/10 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Briefcase className="h-4 w-4" />
                Für Steuerkanzleien
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Finden Sie die besten Talente für Ihre Kanzlei
              </h1>
              <p className="text-lg opacity-90 mb-8">
                Der Fachkräftemangel in der Steuerberatung ist real. Wir helfen Ihnen, 
                qualifizierte Mitarbeiter zu finden – schnell, diskret und passgenau.
              </p>
              <Button size="lg" variant="secondary" className="bg-background text-primary hover:bg-background/90">
                <a href="#kontakt">Jetzt unverbindlich anfragen</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-16 container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Die Herausforderungen kennen wir
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Die Suche nach qualifizierten Steuerfachkräften wird immer schwieriger.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {painPoints.map((point, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <point.icon className="h-7 w-7 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{point.title}</h3>
                  <p className="text-sm text-muted-foreground">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Solutions */}
        <section className="py-16 bg-secondary/20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Unsere Lösung für Sie
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Kanzleistelle24 ist Ihr Partner für spezialisiertes Recruiting in der Steuerbranche.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {solutions.map((solution, index) => (
                <Card key={index} className="text-center border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-8 pb-6">
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <solution.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{solution.title}</h3>
                    <p className="text-sm text-muted-foreground">{solution.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats / Social Proof */}
        <section className="py-16 container">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">100%</div>
              <p className="text-muted-foreground">Branchenfokus Steuer</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">30 Sek.</div>
              <p className="text-muted-foreground">Express-Bewerbung</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">24h</div>
              <p className="text-muted-foreground">Erste Rückmeldung</p>
            </div>
          </div>
        </section>

        {/* Lead Form */}
        <section id="kontakt" className="py-16 bg-secondary/20">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Unverbindlich anfragen</CardTitle>
                  <p className="text-muted-foreground">
                    Erzählen Sie uns von Ihrem Personalbedarf. Wir melden uns innerhalb von 24 Stunden.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Kanzleiname *</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) =>
                            setFormData({ ...formData, companyName: e.target.value })
                          }
                          required
                          placeholder="Muster Steuerberatung GmbH"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Ansprechpartner *</Label>
                        <Input
                          id="contactPerson"
                          value={formData.contactPerson}
                          onChange={(e) =>
                            setFormData({ ...formData, contactPerson: e.target.value })
                          }
                          required
                          placeholder="Max Mustermann"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                          placeholder="info@kanzlei.de"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+49 123 456789"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="positions">Welche Position(en) suchen Sie?</Label>
                      <Select
                        value={formData.positions}
                        onValueChange={(value) =>
                          setFormData({ ...formData, positions: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Bitte wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="steuerfachangestellte">
                            Steuerfachangestellte/r
                          </SelectItem>
                          <SelectItem value="steuerfachwirt">Steuerfachwirt/in</SelectItem>
                          <SelectItem value="bilanzbuchhalter">Bilanzbuchhalter/in</SelectItem>
                          <SelectItem value="lohnbuchhalter">Lohnbuchhalter/in</SelectItem>
                          <SelectItem value="steuerberater">Steuerberater/in</SelectItem>
                          <SelectItem value="andere">Andere Position</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Ihre Nachricht</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Erzählen Sie uns mehr über Ihren Personalbedarf..."
                        rows={4}
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? "Wird gesendet..." : "Anfrage absenden"}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Ihre Daten werden vertraulich behandelt. Wir kontaktieren Sie ausschließlich 
                      bezüglich Ihrer Anfrage.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Elements */}
        <section className="py-16 container">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Vertrauen Sie auf unsere Expertise
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">Spezialisiert auf Steuer</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">Persönlich geprüfte Kandidaten</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">Diskrete Vermittlung</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FuerArbeitgeber;
