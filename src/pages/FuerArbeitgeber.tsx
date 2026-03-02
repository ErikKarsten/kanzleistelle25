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
  Zap,
  Phone,
  Mail,
} from "lucide-react";
import officeModernImage from "@/assets/office-modern.jpg";

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
        {/* Hero Section with Image */}
        <section className="relative min-h-[70vh] flex items-center">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${officeModernImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />
          <div className="container relative z-10 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-primary-foreground">
                <div className="inline-flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <Briefcase className="h-4 w-4" />
                  Für Steuerkanzleien
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Finden Sie die besten Talente für Ihre Kanzlei
                </h1>
                <p className="text-xl opacity-90 mb-8">
                  Der Fachkräftemangel in der Steuerberatung ist real. Wir helfen Ihnen, 
                  qualifizierte Mitarbeiter zu finden – schnell, diskret und passgenau.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-primary text-primary-foreground font-bold rounded-md shadow-sm hover:bg-primary/85 text-lg h-13 px-8" asChild>
                    <a href="#kontakt">
                      Jetzt anfragen
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" className="border-2 border-primary-foreground bg-transparent text-primary-foreground font-semibold rounded-md hover:bg-primary-foreground/15 text-lg h-13 px-8">
                    <Phone className="h-5 w-5 mr-2" />
                    Rückruf anfordern
                  </Button>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-6 text-primary-foreground">
                  <Zap className="h-10 w-10 mb-4" />
                  <div className="text-4xl font-bold mb-1">30 Sek.</div>
                  <div className="opacity-80">Express-Bewerbung</div>
                </div>
                <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-6 text-primary-foreground">
                  <Clock className="h-10 w-10 mb-4" />
                  <div className="text-4xl font-bold mb-1">24h</div>
                  <div className="opacity-80">Erste Rückmeldung</div>
                </div>
                <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-6 text-primary-foreground">
                  <Award className="h-10 w-10 mb-4" />
                  <div className="text-4xl font-bold mb-1">100%</div>
                  <div className="opacity-80">Branchenfokus</div>
                </div>
                <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-6 text-primary-foreground">
                  <CheckCircle2 className="h-10 w-10 mb-4" />
                  <div className="text-4xl font-bold mb-1">Geprüft</div>
                  <div className="opacity-80">Jeder Kandidat</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-20 container">
          <div className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Die Realität im Markt</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Die Herausforderungen kennen wir
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Die Suche nach qualifizierten Steuerfachkräften wird immer schwieriger.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {painPoints.map((point, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-10 pb-8">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                    <point.icon className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3">{point.title}</h3>
                  <p className="text-muted-foreground">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Solutions */}
        <section className="py-20 bg-secondary/20">
          <div className="container">
            <div className="text-center mb-14">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Ihr Recruiting-Partner</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
                Unsere Lösung für Sie
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Kanzleistelle24 ist Ihr Partner für spezialisiertes Recruiting in der Steuerbranche.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {solutions.map((solution, index) => (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="pt-10 pb-8">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                      <solution.icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <h3 className="font-bold text-xl text-foreground mb-3">{solution.title}</h3>
                    <p className="text-muted-foreground">{solution.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Lead Form */}
        <section id="kontakt" className="py-20">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Form */}
              <Card className="border-0 shadow-2xl">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Unverbindlich anfragen</CardTitle>
                  <p className="text-muted-foreground">
                    Erzählen Sie uns von Ihrem Personalbedarf. Wir melden uns innerhalb von 24 Stunden.
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
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
                          className="h-12"
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
                          className="h-12"
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
                          className="h-12"
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
                          className="h-12"
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
                        <SelectTrigger className="h-12">
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

                    <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
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

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Sprechen Sie mit uns
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    Haben Sie Fragen? Unser Team ist für Sie da und berät Sie gerne 
                    zu unseren Recruiting-Lösungen.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-secondary/50 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">E-Mail</h4>
                      <p className="text-muted-foreground">kontakt@kanzleistelle24.de</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-secondary/50 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Telefon</h4>
                      <p className="text-muted-foreground">+49 (0) 123 456 789</p>
                      <p className="text-sm text-muted-foreground">Mo-Fr 9:00 - 18:00 Uhr</p>
                    </div>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="pt-8 border-t">
                  <h4 className="font-semibold text-foreground mb-4">Vertrauen Sie auf:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">Spezialisiert auf die Steuerbranche</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">Persönlich geprüfte Kandidaten</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">Diskrete und professionelle Vermittlung</span>
                    </div>
                  </div>
                </div>
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
