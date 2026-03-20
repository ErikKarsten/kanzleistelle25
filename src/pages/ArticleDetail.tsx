import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, BookOpen } from "lucide-react";
import careerProfessionalImage from "@/assets/career-professional.webp";

const PLACEHOLDER_IMAGE = careerProfessionalImage;

const renderMarkdown = (text: string) => {
  // Simple markdown renderer for common patterns
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-xl font-semibold text-foreground mt-8 mb-3">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-2xl font-bold text-foreground mt-10 mb-4">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-3xl font-bold text-foreground mt-10 mb-4">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-2 my-4 text-muted-foreground">
          {items.map((item, idx) => <li key={idx}>{formatInline(item)}</li>)}
        </ul>
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-muted-foreground leading-relaxed my-3">{formatInline(line)}</p>);
    }
    i++;
  }

  return elements;
};

const formatInline = (text: string) => {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["article-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container max-w-3xl py-8 px-4">
          {/* Back Navigation */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/karrieretipps">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Übersicht
            </Link>
          </Button>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Artikel nicht gefunden</h2>
              <p className="text-muted-foreground mb-6">
                Dieser Artikel existiert nicht oder wurde nicht veröffentlicht.
              </p>
              <Button asChild>
                <Link to="/karrieretipps">Alle Artikel ansehen</Link>
              </Button>
            </div>
          )}

          {!isLoading && article && (
            <article>
              {/* Header */}
              <div className="mb-8">
                {article.category && (
                  <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                    {article.category}
                  </Badge>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {article.title}
                </h1>
                {article.excerpt && (
                  <p className="text-lg text-muted-foreground mb-4">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {article.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(article.published_at)}
                    </span>
                  )}
                  {article.reading_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {article.reading_time}
                    </span>
                  )}
                </div>
              </div>

              {/* Hero Image */}
              <div className="rounded-xl overflow-hidden mb-10">
                <img
                  src={article.image_url || PLACEHOLDER_IMAGE}
                  alt={article.title}
                  className="w-full h-64 md:h-80 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Content */}
              <div className="prose-custom">
                {article.content ? renderMarkdown(article.content) : (
                  <p className="text-muted-foreground">Kein Inhalt vorhanden.</p>
                )}
              </div>

              {/* Back CTA */}
              <div className="border-t mt-12 pt-8 text-center">
                <p className="text-muted-foreground mb-4">Weitere Karrieretipps entdecken</p>
                <Button asChild>
                  <Link to="/karrieretipps">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Alle Artikel
                  </Link>
                </Button>
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArticleDetail;
