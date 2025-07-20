import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Eye,
  Heart,
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  BookOpen,
  Clock,
  User,
  Share2,
  Bookmark,
  MessageCircle,
  TrendingUp,
  Star,
  Play,
  Sparkles,
  Award,
  Crown,
  Zap,
  Coffee,
  Scissors,
  Palette,
  Target,
  ChevronRight,
  X,
  Grid3X3,
  List,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Article {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  video_url?: string;
  status: string;
  categories?: string;
  created_at: string;
  published_at?: string;
  view_count: number;
  likes_count: number;
  comments_count?: number;
  reading_time?: number;
  first_name: string;
  last_name: string;
  author_role: string;
  is_featured?: boolean;
  is_trending?: boolean;
  is_premium?: boolean;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  count?: number;
}

export default function Blog() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("latest");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = React.useState(false);
  const [likedArticles, setLikedArticles] = React.useState<Set<number>>(
    new Set(),
  );
  const [bookmarkedArticles, setBookmarkedArticles] = React.useState<
    Set<number>
  >(new Set());

  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || "Erreur inconnue");
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  const defaultArticleImages = [
    "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1503951458645-643d53bfd90f?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop",
  ];

  const mockArticles: Article[] = [
    {
      id: 1,
      title: "Les Tendances Coiffure 2024 : Style Moderne et Élégance",
      content:
        "Découvrez les dernières tendances en matière de coiffure masculine pour 2024. Cette année marque un retour vers l'élégance naturelle avec des coupes qui mettent en valeur la personnalité de chacun...",
      excerpt:
        "Les tendances coiffure 2024 mettent l'accent sur l'élégance naturelle et les coupes modernes qui s'adaptent à tous les types de visages.",
      featured_image: defaultArticleImages[0],
      status: "published",
      categories: "Tendances,Style",
      created_at: "2024-01-15T10:00:00Z",
      published_at: "2024-01-15T10:00:00Z",
      view_count: 1247,
      likes_count: 89,
      comments_count: 24,
      reading_time: 8,
      first_name: "Hassan",
      last_name: "Alami",
      author_role: "Barbier Expert",
      is_featured: true,
      is_trending: true,
    },
    {
      id: 2,
      title: "Comment Entretenir sa Barbe : Guide Complet pour Débutants",
      content:
        "Un guide complet pour entretenir votre barbe et la garder en parfait état. Découvrez les techniques professionnelles et les produits essentiels...",
      excerpt:
        "L'entretien de la barbe nécessite des soins quotidiens et des produits de qualité pour un résultat optimal et une apparence soignée.",
      featured_image: defaultArticleImages[1],
      status: "published",
      categories: "Soins,Barbe",
      created_at: "2024-01-12T14:30:00Z",
      published_at: "2024-01-12T14:30:00Z",
      view_count: 2156,
      likes_count: 156,
      comments_count: 42,
      reading_time: 12,
      first_name: "Youssef",
      last_name: "Bennani",
      author_role: "Spécialiste Barbe",
      is_featured: true,
      is_premium: true,
    },
    {
      id: 3,
      title: "Les Secrets des Barbiers Marocains Traditionnels",
      content:
        "Découvrez les techniques ancestrales des barbiers marocains et leur savoir-faire unique transmis de génération en génération...",
      excerpt:
        "Les barbiers marocains utilisent des techniques traditionnelles uniques qui font leur réputation dans le monde entier.",
      featured_image: defaultArticleImages[2],
      status: "published",
      categories: "Tradition,Culture",
      created_at: "2024-01-10T09:15:00Z",
      published_at: "2024-01-10T09:15:00Z",
      view_count: 1893,
      likes_count: 234,
      comments_count: 31,
      reading_time: 15,
      first_name: "Omar",
      last_name: "Tazi",
      author_role: "Barbier Traditionnel",
      is_trending: true,
    },
    {
      id: 4,
      title: "Produits de Coiffure : Comment Choisir les Meilleurs",
      content:
        "Guide pour choisir les meilleurs produits de coiffure selon votre type de cheveux et votre style de vie...",
      excerpt:
        "Le choix des produits de coiffure est crucial pour obtenir le résultat souhaité et préserver la santé de vos cheveux.",
      featured_image: defaultArticleImages[3],
      status: "published",
      categories: "Produits,Conseils",
      created_at: "2024-01-08T16:45:00Z",
      published_at: "2024-01-08T16:45:00Z",
      view_count: 1678,
      likes_count: 98,
      comments_count: 18,
      reading_time: 10,
      first_name: "Mehdi",
      last_name: "Benali",
      author_role: "Expert Produits",
      is_premium: true,
    },
    {
      id: 5,
      title: "Coupes de Cheveux pour Visage Rond : Guide Complet",
      content:
        "Les meilleures coupes de cheveux pour les hommes ayant un visage rond. Conseils d'experts pour un look harmonieux...",
      excerpt:
        "Choisir la bonne coupe selon la forme de son visage est essentiel pour un look harmonieux et élégant.",
      featured_image: defaultArticleImages[4],
      status: "published",
      categories: "Conseils,Style",
      created_at: "2024-01-05T11:20:00Z",
      published_at: "2024-01-05T11:20:00Z",
      view_count: 2341,
      likes_count: 187,
      comments_count: 29,
      reading_time: 9,
      first_name: "Karim",
      last_name: "Alaoui",
      author_role: "Styliste Expert",
      is_featured: true,
    },
    {
      id: 6,
      title: "L'Art du Rasage : Techniques Professionnelles",
      content:
        "Maîtrisez l'art du rasage avec les techniques des professionnels. Découvrez les secrets d'un rasage parfait...",
      excerpt:
        "Le rasage est un art qui nécessite technique, patience et les bons outils pour un résultat parfait.",
      featured_image: defaultArticleImages[5],
      status: "published",
      categories: "Rasage,Technique",
      created_at: "2024-01-03T13:10:00Z",
      published_at: "2024-01-03T13:10:00Z",
      view_count: 1987,
      likes_count: 145,
      comments_count: 35,
      reading_time: 14,
      first_name: "Amine",
      last_name: "Zahra",
      author_role: "Spécialiste Rasage",
      is_trending: true,
    },
  ];

  React.useEffect(() => {
    setTimeout(() => {
      setArticles(mockArticles);
      setCategories([
        {
          id: 1,
          name: "Tendances",
          description: "Les dernières tendances",
          icon: "✨",
          color: "purple",
          count: 24,
        },
        {
          id: 2,
          name: "Style",
          description: "Conseils de style",
          icon: "💫",
          color: "blue",
          count: 18,
        },
        {
          id: 3,
          name: "Soins",
          description: "Soins et entretien",
          icon: "🧴",
          color: "green",
          count: 15,
        },
        {
          id: 4,
          name: "Barbe",
          description: "Tout sur la barbe",
          icon: "🧔",
          color: "orange",
          count: 12,
        },
        {
          id: 5,
          name: "Tradition",
          description: "Techniques traditionnelles",
          icon: "🏛️",
          color: "red",
          count: 8,
        },
        {
          id: 6,
          name: "Produits",
          description: "Guide des produits",
          icon: "🛍️",
          color: "indigo",
          count: 14,
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const handleLike = async (articleId: number) => {
    setLikedArticles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });

    setArticles((prev) =>
      prev.map((article) =>
        article.id === articleId
          ? {
              ...article,
              likes_count: likedArticles.has(articleId)
                ? article.likes_count - 1
                : article.likes_count + 1,
            }
          : article,
      ),
    );
  };

  const handleBookmark = (articleId: number) => {
    setBookmarkedArticles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      selectedCategory === "all" ||
      article.categories?.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.view_count - a.view_count;
      case "liked":
        return b.likes_count - a.likes_count;
      case "comments":
        return (b.comments_count || 0) - (a.comments_count || 0);
      case "reading":
        return (a.reading_time || 0) - (b.reading_time || 0);
      case "latest":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

  if (globalError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-destructive mb-4">Erreur</h2>
          <p className="text-muted-foreground">{globalError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="w-px h-6 bg-border"></div>
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-modern-gradient-primary shadow-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-foreground">
                  Blog ShopTheBarber
                </h1>
                <p className="text-xs text-muted-foreground">
                  Expertise & Inspiration
                </p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground border-border/50"
            >
              <Coffee className="h-4 w-4 mr-2" />
              Newsletter
            </Button>
            <div className="w-px h-6 bg-border"></div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden modern-bg">
        <div className="absolute inset-0 bg-modern-gradient-primary opacity-5"></div>

        <div className="container mx-auto relative z-10">
          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="mb-6">
              <Badge className="bg-modern-gradient-primary text-white border-0 px-4 py-2 text-sm font-semibold rounded-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Blog Premium
              </Badge>
            </div>

            <h1 className="text-6xl md:text-7xl font-black text-foreground mb-6 tracking-tight">
              Style & Expertise
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Découvrez les secrets des meilleurs barbiers, les tendances qui
              façonnent le style masculin et les techniques qui subliment votre
              image.
            </p>

            {/* Hero Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-modern-blue mb-1">
                  50+
                </div>
                <div className="text-sm text-muted-foreground">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-modern-purple mb-1">
                  15+
                </div>
                <div className="text-sm text-muted-foreground">Experts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-modern-blue mb-1">
                  10k+
                </div>
                <div className="text-sm text-muted-foreground">Lecteurs</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {/* Search */}
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher un article..."
                    className="pl-12 pr-4 py-3 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-accent rounded-xl h-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="bg-card border-border text-foreground h-12 rounded-xl">
                    <SelectValue placeholder="Catégories" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Toutes</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort by */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-card border-border text-foreground h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="latest">Plus récents</SelectItem>
                    <SelectItem value="popular">Plus populaires</SelectItem>
                    <SelectItem value="liked">Plus aimés</SelectItem>
                    <SelectItem value="comments">Plus commentés</SelectItem>
                    <SelectItem value="reading">Lecture rapide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name ? "all" : category.name,
                  )
                }
                className={`group p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  selectedCategory === category.name
                    ? "border-accent bg-accent/10 shadow-lg shadow-accent/20"
                    : "border-border/50 bg-card hover:border-accent/50 hover:shadow-md"
                }`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="font-semibold text-sm text-foreground mb-1">
                  {category.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {category.count} articles
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div
              className={`${
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "space-y-6"
              }`}
            >
              {[...Array(6)].map((_, i) => (
                <Card
                  key={i}
                  className="bg-card border-border/50 animate-pulse overflow-hidden"
                >
                  <div className="h-48 bg-muted"></div>
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div
              className={`${
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "space-y-6"
              } fade-in`}
            >
              {sortedArticles.map((article, index) => (
                <Card
                  key={article.id}
                  className={`group bg-card border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/10 overflow-hidden ${
                    viewMode === "grid"
                      ? "hover:scale-[1.02] hover:-translate-y-2"
                      : "flex items-start gap-6 p-6"
                  }`}
                >
                  {/* Article Image */}
                  <div
                    className={`relative overflow-hidden ${
                      viewMode === "grid" ? "h-56" : "w-48 h-32 flex-shrink-0"
                    }`}
                  >
                    <img
                      src={
                        article.featured_image ||
                        defaultArticleImages[
                          article.id % defaultArticleImages.length
                        ]
                      }
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {article.is_featured && (
                        <Badge className="bg-black/80 text-white px-2 py-1 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {article.is_trending && (
                        <Badge className="bg-black/80 text-white px-2 py-1 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {article.is_premium && (
                        <Badge className="bg-black/80 text-white px-2 py-1 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    {/* Category Badge */}
                    {article.categories && (
                      <div className="absolute bottom-4 left-4">
                        <Badge className="bg-black/80 text-white border-0 px-3 py-1 text-xs font-medium">
                          {article.categories.split(",")[0]}
                        </Badge>
                      </div>
                    )}

                    {/* Reading time */}
                    {article.reading_time && (
                      <div className="absolute bottom-4 right-4">
                        <div className="flex items-center space-x-1 bg-black/80 text-white px-2 py-1 rounded-full text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{article.reading_time} min</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={viewMode === "grid" ? "p-6" : "flex-1"}>
                    {/* Article Content */}
                    <div className="mb-4">
                      <h3
                        className={`font-bold text-foreground mb-3 group-hover:text-accent transition-colors ${
                          viewMode === "grid"
                            ? "text-xl line-clamp-2"
                            : "text-lg line-clamp-1"
                        }`}
                      >
                        {article.title}
                      </h3>
                      <p
                        className={`text-muted-foreground ${
                          viewMode === "grid"
                            ? "text-sm line-clamp-3"
                            : "text-sm line-clamp-2"
                        }`}
                      >
                        {article.excerpt}
                      </p>
                    </div>

                    {/* Author and Date */}
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-modern-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {article.first_name.charAt(0)}
                            {article.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {article.first_name} {article.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {article.author_role}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(article.created_at)}
                      </div>
                    </div>

                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{article.view_count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{article.likes_count}</span>
                        </div>
                        {article.comments_count && (
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{article.comments_count}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(article.id)}
                          className={`p-2 ${
                            likedArticles.has(article.id)
                              ? "text-red-500 hover:text-red-600"
                              : "text-muted-foreground hover:text-red-500"
                          }`}
                        >
                          <Heart
                            className={`h-4 w-4 ${likedArticles.has(article.id) ? "fill-current" : ""}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmark(article.id)}
                          className={`p-2 ${
                            bookmarkedArticles.has(article.id)
                              ? "text-blue-500 hover:text-blue-600"
                              : "text-muted-foreground hover:text-blue-500"
                          }`}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${bookmarkedArticles.has(article.id) ? "fill-current" : ""}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-muted-foreground hover:text-accent"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Read More Button */}
                    <div className="mt-4">
                      <Button className="w-full bg-modern-gradient-primary text-white hover:opacity-90 transition-all duration-300 group-hover:scale-105">
                        Lire l'article
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && sortedArticles.length === 0 && (
            <div className="text-center py-24">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Aucun article trouvé
              </h3>
              <p className="text-muted-foreground mb-6">
                Essayez d'ajuster vos filtres ou votre recherche
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSortBy("latest");
                }}
                className="bg-modern-gradient-primary text-white"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-16 h-16 bg-modern-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Restez Inspiré
              </h2>
              <p className="text-xl text-muted-foreground">
                Recevez nos derniers articles et conseils d'experts directement
                dans votre boîte mail
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Votre email..."
                className="flex-1 bg-background border-border text-foreground h-12"
              />
              <Button className="bg-modern-gradient-primary text-white px-8 h-12">
                <Zap className="w-4 h-4 mr-2" />
                S'abonner
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Pas de spam, désinscription à tout moment
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
