import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const articles = [
  {
    id: 1,
    title: "Vorbereitung auf das Steuerberater-Examen",
    excerpt: "Die wichtigsten Tipps und Strategien für eine erfolgreiche Prüfungsvorbereitung. Von der Zeiteinteilung bis zu den besten Lernmethoden.",
    category: "Examen",
    readTime: "8 Min. Lesezeit",
    date: "15. Januar 2025",
    featured: true,
  },
  {
    id: 2,
    title: "Lebenslauf-Check für Kanzleien",
    excerpt: "Was erwarten Steuerkanzleien von Bewerbern? Wir zeigen Ihnen, wie Sie Ihren Lebenslauf optimal auf die Branche ausrichten.",
    category: "Bewerbung",
    readTime: "5 Min. Lesezeit",
    date: "10. Januar 2025",
    featured: false,
  },
  {
    id: 3,
    title: "Wechsel aus der Big 4 in die mittelständische Kanzlei",
    excerpt: "Warum immer mehr Fachkräfte den Schritt vom Großkonzern in die mittelständische Kanzlei wagen – und was Sie dabei beachten sollten.",
    category: "Karriere",
    readTime: "6 Min. Lesezeit",
    date: "5. Januar 2025",
    featured: false,
  },
  {
    id: 4,
    title: "DATEV-Kenntnisse: Was Sie wirklich wissen müssen",
    excerpt: "Ein Überblick über die wichtigsten DATEV-Programme und wie Sie Ihre Kenntnisse für den nächsten Karriereschritt ausbauen.",
    category: "Skills",
    readTime: "7 Min. Lesezeit",
    date: "28. Dezember 2024",
    featured: false,
  },
  {
    id: 5,
    title: "Gehaltsverhandlung in der Steuerberatung",
    excerpt: "Konkrete Tipps für Ihre nächste Gehaltsverhandlung. Was ist realistisch und wie argumentieren Sie überzeugend?",
    category: "Gehalt",
    readTime: "4 Min. Lesezeit",
    date: "20. Dezember 2024",
    featured: false,
  },
  {
    id: 6,
    title: "Work-Life-Balance in der Steuerkanzlei",
    excerpt: "Wie moderne Kanzleien flexible Arbeitsmodelle umsetzen und was Sie bei der Jobsuche beachten sollten.",
    category: "Arbeitswelt",
    readTime: "5 Min. Lesezeit",
    date: "15. Dezember 2024",
    featured: false,
  },
];

const Karrieretipps = () => {
  const featuredArticle = articles.find((a) => a.featured);
  const regularArticles = articles.filter((a) => !a.featured);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-secondary/30 py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <BookOpen className="h-4 w-4" />
                Karriere-Ratgeber
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Karrieretipps für die Steuerbranche
              </h1>
              <p className="text-lg text-muted-foreground">
                Expertenwissen für Ihren nächsten Karriereschritt. Von Bewerbungstipps 
                bis zur Gehaltsverhandlung – wir begleiten Sie auf Ihrem Weg.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Article */}
        {featuredArticle && (
          <section className="py-12 container">
            <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/30 p-8 md:p-12 flex items-center justify-center">
                  <BookOpen className="h-24 w-24 text-primary/30" />
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <Badge variant="secondary" className="w-fit mb-4">
                    {featuredArticle.category}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {featuredArticle.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {featuredArticle.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {featuredArticle.readTime}
                    </span>
                  </div>
                  <Button className="w-fit">
                    Artikel lesen
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </div>
            </Card>
          </section>
        )}

        {/* Article Grid */}
        <section className="py-12 container">
          <h2 className="text-2xl font-bold text-foreground mb-8">Weitere Artikel</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow group cursor-pointer">
                <CardHeader className="pb-4">
                  <Badge variant="outline" className="w-fit mb-2">
                    {article.category}
                  </Badge>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Bereit für den nächsten Schritt?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Entdecken Sie aktuelle Stellenangebote in der Steuerbranche und bewerben Sie sich in nur 30 Sekunden.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/">
                Jobs entdecken
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Karrieretipps;
