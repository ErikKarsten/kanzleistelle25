import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, Star, Eye, Archive, FileText, GripVertical, Clock } from "lucide-react";
import { toast } from "sonner";
import ArticleImageUpload from "./ArticleImageUpload";
import ArticlePreviewModal from "./ArticlePreviewModal";

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
  status: string;
  sort_order: number;
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
  status: string;
  sort_order: number;
  published_at: string;
  author_id: string;
}

const emptyForm: ArticleForm = {
  title: "",
  excerpt: "",
  content: "",
  image_url: "",
  category: "",
  reading_time: "",
  is_featured: false,
  status: "draft",
  sort_order: 0,
  published_at: "",
  author_id: "",
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Entwurf", color: "secondary" as const },
  { value: "published", label: "Veröffentlicht", color: "default" as const },
  { value: "archived", label: "Archiviert", color: "outline" as const },
];

const isScheduled = (article: { status: string; published_at: string | null }) =>
  article.status === "published" && article.published_at && new Date(article.published_at) > new Date();

const toLocalDatetime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ArticleManagement = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const queryClient = useQueryClient();

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
  });

  const { data: contactPersons } = useQuery({
    queryKey: ["contact-persons-for-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_persons")
        .select("id, name, role")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ArticleForm & { id?: string }) => {
      const isPublishing = data.status === "published";
      const publishedAt = data.published_at
        ? new Date(data.published_at).toISOString()
        : isPublishing
          ? new Date().toISOString()
          : null;
      const payload: Record<string, any> = {
        title: data.title.trim(),
        excerpt: data.excerpt.trim() || null,
        content: data.content.trim() || null,
        image_url: data.image_url.trim() || null,
        category: data.category.trim() || null,
        reading_time: data.reading_time.trim() || null,
        is_featured: data.is_featured,
        is_published: isPublishing,
        status: data.status,
        sort_order: data.sort_order,
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
        author_id: data.author_id || null,
      };

      if (data.id) {
        const { error } = await supabase.from("articles").update(payload as any).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success(editingArticle ? "Artikel aktualisiert" : "Artikel erstellt");
      closeModal();
    },
    onError: (err) => toast.error("Fehler: " + (err as Error).message),
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

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const isPublishing = status === "published";
      const { error } = await supabase
        .from("articles")
        .update({
          status,
          is_published: isPublishing,
          published_at: isPublishing ? new Date().toISOString() : null,
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
      status: article.status || "draft",
      sort_order: article.sort_order ?? 0,
      published_at: toLocalDatetime(article.published_at),
      author_id: (article as any).author_id || "",
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

  const getStatusBadge = (article: Article) => {
    if (isScheduled(article)) {
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <Clock className="h-3 w-3" />
          Geplant
        </Badge>
      );
    }
    const opt = STATUS_OPTIONS.find((s) => s.value === article.status);
    return (
      <Badge variant={opt?.color ?? "secondary"} className="text-xs">
        {opt?.label ?? article.status}
      </Badge>
    );
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
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => {
                  const isArchived = article.status === "archived";
                  return (
                    <TableRow
                      key={article.id}
                      className={isArchived ? "opacity-50" : ""}
                    >
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                          {article.sort_order}
                        </div>
                      </TableCell>
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
                      <TableCell>{getStatusBadge(article)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(article.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Vorschau"
                            onClick={() => setPreviewArticle(article)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {/* Quick status toggle */}
                          {article.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              title="Veröffentlichen"
                              onClick={() =>
                                statusMutation.mutate({ id: article.id, status: "published" })
                              }
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {article.status === "published" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Archivieren"
                              onClick={() =>
                                statusMutation.mutate({ id: article.id, status: "archived" })
                              }
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          {article.status === "archived" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Zurück auf Entwurf"
                              onClick={() =>
                                statusMutation.mutate({ id: article.id, status: "draft" })
                              }
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(article)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {/* Delete */}
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
                  );
                })}
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
                <Label>Lesezeit (Minuten)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    value={form.reading_time}
                    onChange={(e) => setForm({ ...form, reading_time: e.target.value })}
                    placeholder="z.B. 5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    Min.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Sortierung</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Featured
                  </span>
                </label>
              </div>
            </div>

            <div>
              <Label>Ansprechpartner (optional)</Label>
              <select
                value={form.author_id}
                onChange={(e) => setForm({ ...form, author_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Standard (Neele Ehlers)</option>
                {contactPersons?.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name}{cp.role ? ` – ${cp.role}` : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Wählen Sie, wer als Ansprechpartner auf dieser Seite angezeigt wird.
              </p>
            </div>

            {form.status === "published" && (
              <div>
                <Label>Veröffentlichungszeitpunkt</Label>
                <Input
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leer = sofort veröffentlichen. Datum in der Zukunft = geplante Veröffentlichung (Artikel erscheint erst dann öffentlich).
                </p>
              </div>
            )}

            <ArticleImageUpload
              currentImageUrl={form.image_url}
              onUploadComplete={(url) => setForm({ ...form, image_url: url })}
            />

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

      {/* Preview Modal */}
      <ArticlePreviewModal
        article={previewArticle}
        onClose={() => setPreviewArticle(null)}
      />
    </Card>
  );
};

export default ArticleManagement;
