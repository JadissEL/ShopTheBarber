import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { sovereign } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import SearchField from '@/components/ui/search-field';
import { Card } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Eye, TrendingUp, BookOpen, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import PageHeader from "@/components/layout/PageHeader";
import PageContent from "@/components/layout/PageContent";
import { cn } from "@/lib/utils";
import { stb } from "@/lib/stbUi";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      return await sovereign.articles.listPublic();
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
    <div className="stb-page pb-16">
      <PageHeader
        label="Blog & inspiration"
        title="L'univers du grooming"
        subtitle="Conseils, tendances et techniques par des experts passionnés"
      />

      <PageContent>
        <div className={cn(stb.surface, 'p-6 mb-12')}>
          <div className="flex flex-col lg:flex-row gap-6">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search articles..."
              size="lg"
              className="flex-1"
              aria-label="Search blog articles"
            />

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="bg-muted h-12 rounded-lg">
                {categories.slice(0, 4).map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background text-muted-foreground min-h-[44px]"
                  >
                    <span className="mr-2">{cat.icon}</span>
                    <span className="hidden sm:inline">{cat.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {featuredArticle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 stb-marketing-prose"
          >
            <Link to={createPageUrl(`ArticleDetail?id=${featuredArticle.id}`)}>
              <Card className={cn(stb.surfaceHover, 'group overflow-hidden border-foreground/10')}>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="relative h-[400px] md:h-auto overflow-hidden bg-muted">
                    {featuredArticle.image_url ? (
                      <img
                        src={featuredArticle.image_url}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-24 h-24 text-primary/30" />
                      </div>
                    )}
                    <Badge className="absolute top-4 left-4 bg-primary border-0 text-primary-foreground">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      À la Une
                    </Badge>
                  </div>

                  <div className="p-8 flex flex-col justify-center bg-card">
                    <Badge className="w-fit mb-4 bg-muted text-foreground border-0">
                      {categories.find(c => c.id === featuredArticle.category)?.icon || "📰"}{" "}
                      {categories.find(c => c.id === featuredArticle.category)?.label || featuredArticle.category}
                    </Badge>

                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                      {featuredArticle.title}
                    </h2>

                    <p className="text-muted-foreground text-lg mb-6 line-clamp-3">
                      {featuredArticle.excerpt}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(featuredArticle.created_date), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{featuredArticle.views || 0} vues</span>
                      </div>
                    </div>

                    <Button className="mt-6 w-fit min-h-[44px]">
                      Lire l'Article
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-foreground/10">
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
          <div className={cn(stb.surface, 'p-16 text-center border-foreground/10')}>
            <BookOpen className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
            <h3 className={cn(stb.uiHeading, 'text-2xl mb-3')}>
              Aucun article trouvé
            </h3>
            <p className="text-muted-foreground">
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
                  <Card className={cn(stb.surfaceHover, 'group overflow-hidden border-foreground/10 h-full flex flex-col')}>
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {article.image_url ? (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-primary/30" />
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-1 bg-card">
                      <Badge className="w-fit mb-3 bg-primary/10 text-primary border-0 text-xs">
                        {categories.find(c => c.id === article.category)?.icon || "📰"}{" "}
                        {categories.find(c => c.id === article.category)?.label || article.category}
                      </Badge>

                      <h3 className={cn(stb.uiHeading, 'text-xl mb-3 group-hover:text-primary transition-colors line-clamp-2')}>
                        {article.title}
                      </h3>

                      <p className="text-muted-foreground mb-4 line-clamp-2 flex-1">
                        {article.excerpt}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
      </PageContent>
    </div>
  );
}
