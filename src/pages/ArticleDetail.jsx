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

export default function ArticleDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const articleId = searchParams.get('id');

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => sovereign.articles.getPublic(articleId),
    enabled: !!articleId
  });

  const incrementViewMutation = useMutation({
    mutationFn: async () => { if (articleId) await sovereign.articles.recordView(articleId); },
  });

  React.useEffect(() => { if (article && !isLoading) incrementViewMutation.mutate(); }, [article?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 bg-[#F7F8FA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-96 w-full rounded-[12px] mb-8" /><Skeleton className="h-12 w-3/4 mb-4" /><Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Article non trouvé</h2>
          <Button onClick={() => navigate(createPageUrl("Blog"))} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">Retour au Blog</Button>
        </div>
      </div>
    );
  }

  const readingTime = Math.ceil((article.content?.length || 0) / 1000);

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Button variant="ghost" className="text-[#4B5563] hover:bg-muted rounded-[10px] min-h-[44px]" onClick={() => navigate(createPageUrl("Blog"))}>
            <ChevronLeft className="w-5 h-5 mr-2" />Retour au Blog
          </Button>
        </motion.div>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {article.image_url && (
            <div className="relative aspect-video rounded-[12px] overflow-hidden mb-8 shadow-2xl border-2 border-slate-200">
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <Badge className="bg-[#D08B3D] text-white border-0">{article.category}</Badge>
            {article.tags?.map((tag, idx) => (<Badge key={idx} variant="outline" className="border-slate-300 text-[#4B5563]">#{tag}</Badge>))}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[#0B2545] mb-6 leading-tight">{article.title}</h1>

          <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 ring-2 ring-slate-200">
                <AvatarFallback className="bg-[#0B2545] text-white font-bold">A</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[#0B2545] font-semibold">Auteur Expert</p>
                <p className="text-[#4B5563] text-sm">{format(new Date(article.created_date), 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-[#4B5563]">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span className="text-sm">{readingTime} min</span></div>
              <div className="flex items-center gap-2"><Eye className="w-4 h-4" /><span className="text-sm">{article.views || 0}</span></div>
            </div>
          </div>

          <Card className="rounded-[12px] border-2 border-slate-200 p-8 md:p-12 mb-8">
            <div className="prose prose-lg max-w-none" style={{ color: '#4B5563', fontSize: '1.125rem', lineHeight: '1.8' }}>
              <p className="text-xl text-[#4B5563] leading-relaxed mb-8">{article.excerpt}</p>
              <div className="whitespace-pre-wrap text-[#4B5563] leading-relaxed">{article.content}</div>
            </div>
          </Card>

          <div className="flex items-center gap-4 mb-12">
            <Button className="flex-1 border-2 border-slate-200 text-[#4B5563] hover:bg-muted bg-card rounded-[10px] h-14 min-h-[44px]"><ThumbsUp className="w-5 h-5 mr-2" />J'aime ({article.likes || 0})</Button>
            <Button className="flex-1 border-2 border-slate-200 text-[#4B5563] hover:bg-muted bg-card rounded-[10px] h-14 min-h-[44px]"><Heart className="w-5 h-5 mr-2" />Sauvegarder</Button>
            <Button className="border-2 border-slate-200 text-[#4B5563] hover:bg-muted bg-card rounded-[10px] h-14 px-6 min-h-[44px]"><Share2 className="w-5 h-5" /></Button>
          </div>

          <Card className="rounded-[12px] border-2 border-slate-200 p-8 text-center bg-card">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#0B2545] mb-3">Découvrir Plus d'Articles</h3>
            <p className="text-[#4B5563] mb-6">Explorez notre collection de conseils et tendances</p>
            <Button onClick={() => navigate(createPageUrl("Blog"))} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">Retour au Blog</Button>
          </Card>
        </motion.article>
      </div>
    </div>
  );
}