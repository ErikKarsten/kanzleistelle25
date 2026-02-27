import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string | null;
  reading_time: string | null;
  is_featured: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ArticleForm {
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  reading_time: string;
  is_featured: boolean;
  is_published: boolean;
}

const emptyForm: ArticleForm = {
  title: "",
  excerpt: "",
  content: "",
  image_url: "",
  category: "",
  reading_time: "",
  is_featured: false,
  is_published: false,
};

const ArticleManagement = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const queryClient = useQueryClient();

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ArticleForm & { id?: string }) => {
      const payload = {
        title: data.title.trim(),
        excerpt: data.excerpt.trim() || null,
        content: data.content.trim() || null,
        image_url: data.image_url.trim() || null,
        category: data.category.trim() || null,
        reading_time: data.reading_time.trim() || null,
        is_featured: data.is_featured,
        is_published: data.is_published,
        published_at: data.is_published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (data.id) {
        const { error } = await supabase
          .from("articles")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success(editingArticle ? "Artikel aktualisiert" : "Artikel erstellt");
      closeModal();
    },
    onError: (err) => {
      toast.error("Fehler beim Speichern: " + (err as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("Artikel gelöscht");
    },
    onError: () => toast.error("Fehler beim Löschen"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { error } = await supabase
        .from("articles")
        .update({
          is_published: publish,
          published_at: publish ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("Status aktualisiert");
    },
  });

  const openCreate = () => {
    setEditingArticle(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      excerpt: article.excerpt || "",
      content: article.content || "",
      image_url: article.image_url || "",
      category: article.category || "",
      reading_time: article.reading_time || "",
      is_featured: article.is_featured,
      is_published: article.is_published,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingArticle(null);
    setForm(emptyForm);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Titel ist erforderlich");
      return;
    }
    saveMutation.mutate({ ...form, id: editingArticle?.id });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Blog-Verwaltung</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Artikel
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !articles?.length ? (
          <p className="text-muted-foreground text-center py-8">
            Noch keine Artikel vorhanden.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      <div className="flex items-center gap-2">
                        {article.is_featured && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                        {article.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      {article.category && (
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={article.is_published ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {article.is_published ? "Veröffentlicht" : "Entwurf"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(article.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={article.is_published ? "Zurückziehen" : "Veröffentlichen"}
                          onClick={() =>
                            togglePublish.mutate({
                              id: article.id,
                              publish: !article.is_published,
                            })
                          }
                        >
                          {article.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(article)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Artikel wirklich löschen?")) {
                              deleteMutation.mutate(article.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? "Artikel bearbeiten" : "Neuer Artikel"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Artikeltitel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategorie</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Kategorie wählen</option>
                  <option value="Karriere">Karriere</option>
                  <option value="Gehalt">Gehalt</option>
                  <option value="Examen">Examen</option>
                  <option value="Digitales">Digitales</option>
                </select>
              </div>
              <div>
                <Label>Lesezeit</Label>
                <Input
                  value={form.reading_time}
                  onChange={(e) => setForm({ ...form, reading_time: e.target.value })}
                  placeholder="z.B. 5 Min. Lesezeit"
                />
              </div>
            </div>

            <div>
              <Label>Bild-URL</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Vorschautext</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Kurze Zusammenfassung für die Übersicht..."
                rows={2}
              />
            </div>

            <div>
              <Label>Inhalt (Markdown)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="## Überschrift&#10;&#10;Ihr Artikeltext hier... Markdown wird unterstützt."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                />
                <Label>Featured-Artikel</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                />
                <Label>Veröffentlicht</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={closeModal}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ArticleManagement;
