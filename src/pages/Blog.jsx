import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { sovereign } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, Eye, TrendingUp, Sparkles, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      return await sovereign.entities.Article.filter({ published: true }, '-created_at');
    }
  });

  const categories = [
    { id: "all", label: "Tous les Articles", icon: "📚" },
    { id: "tips", label: "Conseils", icon: "💡" },
    { id: "trends", label: "Tendances", icon: "🔥" },
    { id: "products", label: "Produits", icon: "🛍️" },
    { id: "techniques", label: "Techniques", icon: "✂️" },
    { id: "lifestyle", label: "Lifestyle", icon: "🌟" }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticle = filteredArticles[0];
  const regularArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-[#D08B3D] text-white border-0 px-5 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Blog & Inspiration
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-[#0B2545] mb-4">
            L'Univers du Grooming
          </h1>
          <p className="text-xl text-[#4B5563] max-w-2xl mx-auto">
            Conseils, tendances et techniques par des experts passionnés
          </p>
        </motion.div>

        {/* Search & Filters */}
        <div className="bg-white rounded-[12px] p-6 mb-12 shadow-lg border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563] w-5 h-5" />
              <Input
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-slate-200 text-[#0B2545] placeholder:text-[#4B5563] rounded-[10px] focus:ring-2 focus:ring-[#D08B3D] focus:border-[#D08B3D]"
              />
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="bg-[#F7F8FA] h-12 rounded-[10px]">
                {categories.slice(0, 4).map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="rounded-[8px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white text-[#4B5563] min-h-[44px]"
                  >
                    <span className="mr-2">{cat.icon}</span>
                    <span className="hidden sm:inline">{cat.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <Link to={createPageUrl(`ArticleDetail?id=${featuredArticle.id}`)}>
              <Card className="group rounded-[12px] border-2 border-slate-200 overflow-hidden hover:border-[#D08B3D] hover:shadow-2xl transition-all">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="relative h-[400px] md:h-auto overflow-hidden bg-slate-100">
                    {featuredArticle.image_url ? (
                      <img
                        src={featuredArticle.image_url}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#D08B3D]/10 flex items-center justify-center">
                        <BookOpen className="w-24 h-24 text-[#D08B3D]/30" />
                      </div>
                    )}
                    <Badge className="absolute top-4 left-4 bg-[#D08B3D] border-0 text-white">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      À la Une
                    </Badge>
                  </div>

                  <div className="p-8 flex flex-col justify-center bg-white">
                    <Badge className="w-fit mb-4 bg-[#0B2545]/10 text-[#0B2545] border-0">
                      {categories.find(c => c.id === featuredArticle.category)?.icon || "📰"}{" "}
                      {categories.find(c => c.id === featuredArticle.category)?.label || featuredArticle.category}
                    </Badge>

                    <h2 className="text-3xl md:text-4xl font-bold text-[#0B2545] mb-4 group-hover:text-[#D08B3D] transition-colors">
                      {featuredArticle.title}
                    </h2>

                    <p className="text-[#4B5563] text-lg mb-6 line-clamp-3">
                      {featuredArticle.excerpt}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-[#4B5563]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(featuredArticle.created_date), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{featuredArticle.views || 0} vues</span>
                      </div>
                    </div>

                    <Button className="mt-6 w-fit bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                      Lire l'Article
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-slate-200">
                <Skeleton className="aspect-video w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : regularArticles.length === 0 ? (
          <div className="bg-white rounded-[12px] p-16 text-center border border-slate-200">
            <BookOpen className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-[#0B2545] mb-3">
              Aucun article trouvé
            </h3>
            <p className="text-[#4B5563]">
              Essayez de modifier votre recherche ou vos filtres
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={createPageUrl(`ArticleDetail?id=${article.id}`)}>
                  <Card className="group rounded-[12px] border-2 border-slate-200 overflow-hidden hover:border-[#D08B3D] hover:shadow-2xl transition-all h-full flex flex-col">
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      {article.image_url ? (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#D08B3D]/10 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-[#D08B3D]/30" />
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-1 bg-white">
                      <Badge className="w-fit mb-3 bg-[#D08B3D]/10 text-[#D08B3D] border-0 text-xs">
                        {categories.find(c => c.id === article.category)?.icon || "📰"}{" "}
                        {categories.find(c => c.id === article.category)?.label || article.category}
                      </Badge>

                      <h3 className="text-xl font-bold text-[#0B2545] mb-3 group-hover:text-[#D08B3D] transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-[#4B5563] mb-4 line-clamp-2 flex-1">
                        {article.excerpt}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-[#4B5563]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(article.created_date), 'dd MMM', { locale: fr })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{article.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}