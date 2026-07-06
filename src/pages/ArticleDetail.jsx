import React from 'react';
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { sovereign } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Eye, Heart, Share2, ChevronLeft, BookOpen, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import PageContent from "@/components/layout/PageContent";
import { useSetBreadcrumbTitle } from '@/components/layout/DashboardBreadcrumbContext';
import { cn } from "@/lib/utils";
import { stb } from "@/lib/stbUi";

export default function ArticleDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const articleId = searchParams.get('id');

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => sovereign.articles.getPublic(articleId),
    enabled: !!articleId
  });

  useSetBreadcrumbTitle(article?.title ?? null);

  const incrementViewMutation = useMutation({
    mutationFn: async () => { if (articleId) await sovereign.articles.recordView(articleId); },
  });

  React.useEffect(() => { if (article && !isLoading) incrementViewMutation.mutate(); }, [article?.id]);

  if (isLoading) {
    return (
      <div className="stb-page py-12">
        <PageContent narrow>
          <Skeleton className="h-96 w-full rounded-lg mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </PageContent>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="stb-page min-h-screen flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className={cn(stb.uiHeading, 'text-2xl mb-4')}>Article non trouvé</h2>
          <Button onClick={() => navigate(createPageUrl("Blog"))} className="min-h-[44px]">Retour au Blog</Button>
        </div>
      </div>
    );
  }

  const readingTime = Math.ceil((article.content?.length || 0) / 1000);

  return (
    <div className="stb-page py-12">
      <PageContent narrow className="stb-marketing-prose">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Button variant="ghost" className="text-muted-foreground hover:bg-muted min-h-[44px]" onClick={() => navigate(createPageUrl("Blog"))}>
            <ChevronLeft className="w-5 h-5 mr-2" />Retour au Blog
          </Button>
        </motion.div>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {article.image_url && (
            <div className="relative aspect-video rounded-lg overflow-hidden mb-8 border border-foreground/10">
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <Badge className="bg-primary text-primary-foreground border-0">{article.category}</Badge>
            {article.tags?.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="border-foreground/20 text-muted-foreground">#{tag}</Badge>
            ))}
          </div>

          <h1 className={cn(stb.display, 'text-4xl md:text-6xl text-foreground mb-6 leading-tight')}>{article.title}</h1>

          <div className="flex items-center justify-between mb-8 pb-8 border-b border-foreground/10">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 ring-2 ring-foreground/10">
                <AvatarFallback className="bg-foreground text-background font-semibold">A</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-foreground font-semibold">Auteur Expert</p>
                <p className="text-muted-foreground text-sm">{format(new Date(article.created_date), 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span className="text-sm">{readingTime} min</span></div>
              <div className="flex items-center gap-2"><Eye className="w-4 h-4" /><span className="text-sm">{article.views || 0}</span></div>
            </div>
          </div>

          <Card className={cn(stb.surface, 'border-foreground/10 p-8 md:p-12 mb-8')}>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="text-xl leading-relaxed mb-8">{article.excerpt}</p>
              <div className="whitespace-pre-wrap leading-relaxed">{article.content}</div>
            </div>
          </Card>

          <div className="flex items-center gap-4 mb-12">
            <Button variant="outline" className="flex-1 border-foreground/10 h-14 min-h-[44px]"><ThumbsUp className="w-5 h-5 mr-2" />J'aime ({article.likes || 0})</Button>
            <Button variant="outline" className="flex-1 border-foreground/10 h-14 min-h-[44px]"><Heart className="w-5 h-5 mr-2" />Sauvegarder</Button>
            <Button variant="outline" className="border-foreground/10 h-14 px-6 min-h-[44px]"><Share2 className="w-5 h-5" /></Button>
          </div>

          <Card className={cn(stb.surface, 'border-foreground/10 p-8 text-center')}>
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className={cn(stb.uiHeading, 'text-2xl mb-3')}>Découvrir Plus d'Articles</h3>
            <p className="text-muted-foreground mb-6">Explorez notre collection de conseils et tendances</p>
            <Button onClick={() => navigate(createPageUrl("Blog"))} className="min-h-[44px]">Retour au Blog</Button>
          </Card>
        </motion.article>
      </PageContent>
    </div>
  );
}
