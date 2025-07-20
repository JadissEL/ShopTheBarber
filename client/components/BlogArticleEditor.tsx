import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Edit, Eye, Trash2, FileText } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface Article {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  video_url?: string;
  status: "draft" | "published" | "pending_review" | "rejected";
  categories?: string;
  created_at: string;
  published_at?: string;
  view_count: number;
  likes_count: number;
}

interface BlogArticleEditorProps {
  articles: Article[];
  onArticlesChange: () => void;
}

export default function BlogArticleEditor({
  articles,
  onArticlesChange,
}: BlogArticleEditorProps) {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingArticle, setEditingArticle] = React.useState<Article | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [formData, setFormData] = React.useState({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    videoUrl: "",
    categories: [] as string[],
    status: "draft" as const,
  });

  // Charger les catégories disponibles
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        // Temporarily use mock data since API endpoint doesn't exist
        const mockCategories = [
          "Tendances",
          "Style",
          "Soins",
          "Barbe",
          "Tradition",
          "Produits",
          "Conseils",
          "Technique",
        ];
        setCategories(mockCategories);
        return; // Skip the API call

        const response = await fetch("/api/blog/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.map((cat: any) => cat.name));
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  const handleAddArticle = async () => {
    if (!formData.title || !formData.content) {
      alert("Le titre et le contenu sont obligatoires");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/blog/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || null,
          featuredImage: formData.featuredImage || null,
          videoUrl: formData.videoUrl || null,
          categories: formData.categories,
          status: formData.status,
        }),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setFormData({
          title: "",
          content: "",
          excerpt: "",
          featuredImage: "",
          videoUrl: "",
          categories: [],
          status: "draft",
        });
        onArticlesChange();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de la création de l'article");
      }
    } catch (error) {
      console.error("Error creating article:", error);
      alert("Erreur lors de la création de l'article");
    } finally {
      setLoading(false);
    }
  };

  const handleEditArticle = async () => {
    if (!editingArticle || !formData.title || !formData.content) {
      alert("Le titre et le contenu sont obligatoires");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/blog/articles/${editingArticle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || null,
          featuredImage: formData.featuredImage || null,
          videoUrl: formData.videoUrl || null,
          categories: formData.categories,
          status: formData.status,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingArticle(null);
        setFormData({
          title: "",
          content: "",
          excerpt: "",
          featuredImage: "",
          videoUrl: "",
          categories: [],
          status: "draft",
        });
        onArticlesChange();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de la modification de l'article");
      }
    } catch (error) {
      console.error("Error updating article:", error);
      alert("Erreur lors de la modification de l'article");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/blog/articles/${articleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onArticlesChange();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de la suppression de l'article");
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Erreur lors de la suppression de l'article");
    }
  };

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || "",
      featuredImage: article.featured_image || "",
      videoUrl: article.video_url || "",
      categories: article.categories ? article.categories.split(",") : [],
      status: article.status,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_review":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Publié";
      case "draft":
        return "Brouillon";
      case "pending_review":
        return "En attente";
      case "rejected":
        return "Rejeté";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Articles du Blog</h3>
          <p className="text-sm text-gray-500">
            Créez et gérez vos articles pour partager votre expertise
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouvel article</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Titre de l'article"
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Extrait</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  placeholder="Résumé de l'article"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="content">Contenu *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Contenu de l'article"
                  rows={8}
                />
              </div>
              <div>
                <Label htmlFor="featuredImage">Image de couverture</Label>
                <Input
                  id="featuredImage"
                  value={formData.featuredImage}
                  onChange={(e) =>
                    setFormData({ ...formData, featuredImage: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="videoUrl">URL de la vidéo (optionnel)</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <Label htmlFor="categories">Catégories</Label>
                <Select
                  value={formData.categories[0] || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categories: [value] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="pending_review">
                      En attente de validation
                    </SelectItem>
                    {user?.role === "admin" && (
                      <SelectItem value="published">Publié</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleAddArticle} disabled={loading}>
                  {loading ? "Création..." : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun article créé</p>
            <p className="text-sm text-gray-400">
              Créez votre premier article pour partager votre expertise
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{article.title}</h4>
                      <Badge className={getStatusColor(article.status)}>
                        {getStatusText(article.status)}
                      </Badge>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 mb-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {article.view_count} vues
                      </span>
                      <span>❤️ {article.likes_count}</span>
                      {article.categories && (
                        <span className="text-blue-600">
                          {article.categories}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(article)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteArticle(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Titre *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Titre de l'article"
              />
            </div>
            <div>
              <Label htmlFor="edit-excerpt">Extrait</Label>
              <Textarea
                id="edit-excerpt"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                placeholder="Résumé de l'article"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Contenu *</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Contenu de l'article"
                rows={8}
              />
            </div>
            <div>
              <Label htmlFor="edit-featuredImage">Image de couverture</Label>
              <Input
                id="edit-featuredImage"
                value={formData.featuredImage}
                onChange={(e) =>
                  setFormData({ ...formData, featuredImage: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="edit-videoUrl">URL de la vidéo (optionnel)</Label>
              <Input
                id="edit-videoUrl"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label htmlFor="edit-categories">Catégories</Label>
              <Select
                value={formData.categories[0] || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, categories: [value] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending_review">
                    En attente de validation
                  </SelectItem>
                  {user?.role === "admin" && (
                    <SelectItem value="published">Publié</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleEditArticle} disabled={loading}>
                {loading ? "Modification..." : "Modifier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
