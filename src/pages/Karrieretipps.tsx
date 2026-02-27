import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, BookOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import careerProfessionalImage from "@/assets/career-professional.jpg";

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  reading_time: string | null;
  is_featured: boolean;
  published_at: string | null;
}

const PLACEHOLDER_IMAGE = careerProfessionalImage;

const Karrieretipps = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["public-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, excerpt, image_url, category, reading_time, is_featured, published_at, sort_order")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as (Article & { sort_order: number })[];
    },
  });

  const featuredArticle = articles?.find((a) => a.is_featured);
  const regularArticles = articles?.filter((a) => !a.is_featured) ?? [];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-primary py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/80" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center text-primary-foreground">
              <div className="inline-flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <TrendingUp className="h-4 w-4" />
                Ihr Karriere-Ratgeber
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Karrieretipps für die Steuerbranche
              </h1>
              <p className="text-lg opacity-90">
                Expertenwissen für Ihren nächsten Karriereschritt. Von Bewerbungstipps 
                bis zur Gehaltsverhandlung – wir begleiten Sie auf Ihrem Weg.
              </p>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <section className="py-16 container space-y-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[280px] rounded-xl" />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && (!articles || articles.length === 0) && (
          <section className="py-20 container text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Noch keine Artikel veröffentlicht
            </h2>
            <p className="text-muted-foreground">
              Schauen Sie bald wieder vorbei – neue Karrieretipps sind in Arbeit!
            </p>
          </section>
        )}

        {/* Featured Article */}
        {!isLoading && featuredArticle && (
          <section className="py-16 container">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="grid md:grid-cols-2">
                <div className="relative h-64 md:h-auto">
                  <img 
                    src={featuredArticle.image_url || PLACEHOLDER_IMAGE} 
                    alt={featuredArticle.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:hidden" />
                </div>
                <CardContent className="p-8 md:p-12 flex flex-col justify-center bg-card">
                  {featuredArticle.category && (
                    <Badge className="w-fit mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                      {featuredArticle.category}
                    </Badge>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {featuredArticle.title}
                  </h2>
                  {featuredArticle.excerpt && (
                    <p className="text-muted-foreground mb-6">
                      {featuredArticle.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    {featuredArticle.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(featuredArticle.published_at)}
                      </span>
                    )}
                    {featuredArticle.reading_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {featuredArticle.reading_time}
                      </span>
                    )}
                  </div>
                  <Button className="w-fit" asChild>
                    <Link to={`/ratgeber/${featuredArticle.id}`}>
                      Artikel lesen
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </div>
            </Card>
          </section>
        )}

        {/* Article Grid */}
        {!isLoading && regularArticles.length > 0 && (
          <section className="py-12 container">
            <h2 className="text-2xl font-bold text-foreground mb-8">Weitere Artikel</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularArticles.map((article) => (
                <Link key={article.id} to={`/ratgeber/${article.id}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md overflow-hidden h-full">
                  <div className="h-40 overflow-hidden">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-primary/5 to-secondary/30 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/20 group-hover:scale-110 transition-transform" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    {article.category && (
                      <Badge variant="outline" className="w-fit mb-2 text-xs">
                        {article.category}
                      </Badge>
                    )}
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {article.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(article.published_at)}
                        </span>
                      )}
                      {article.reading_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.reading_time}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter Section */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Bleiben Sie informiert
              </h2>
              <p className="text-muted-foreground mb-8">
                Erhalten Sie die neuesten Karrieretipps und exklusive Stellenangebote 
                direkt in Ihr Postfach.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Ihre E-Mail-Adresse"
                  className="flex-1 px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button size="lg">
                  Anmelden
                </Button>
              </div>
            </div>
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
