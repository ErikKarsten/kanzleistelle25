import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import careerProfessionalImage from "@/assets/career-professional.jpg";

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string | null;
  reading_time: string | null;
  status: string;
  published_at: string | null;
}

interface ArticlePreviewModalProps {
  article: Article | null;
  onClose: () => void;
}

const formatInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderMarkdown = (text: string) => {
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

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const ArticlePreviewModal = ({ article, onClose }: ArticlePreviewModalProps) => {
  if (!article) return null;

  return (
    <Dialog open={!!article} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Vorschau
            <Badge variant={article.status === "published" ? "default" : "secondary"} className="text-xs">
              {article.status === "draft" ? "Entwurf" : article.status === "published" ? "Live" : "Archiviert"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <article className="mt-4">
          {/* Hero Image */}
          <div className="rounded-xl overflow-hidden mb-6">
            <img
              src={article.image_url || careerProfessionalImage}
              alt={article.title}
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>

          {/* Header */}
          <div className="mb-6">
            {article.category && (
              <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/20">
                {article.category}
              </Badge>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-lg text-muted-foreground mb-3">{article.excerpt}</p>
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

          {/* Content */}
          <div className="border-t pt-6">
            {article.content ? renderMarkdown(article.content) : (
              <p className="text-muted-foreground italic">Kein Inhalt vorhanden.</p>
            )}
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
};

export default ArticlePreviewModal;
