import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useHomepage } from '@/hooks/useHomepage';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function HomeContentFeed() {
  const { data, isLoading } = useHomepage();
  const articles = data?.latest_articles ?? [];

  if (isLoading) {
    return (
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4 md:px-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="py-24 bg-background border-t border-foreground/10 stb-marketing-prose">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <div className={cn(stb.label, 'mb-2 flex items-center gap-1')}>
              <BookOpen className="w-3.5 h-3.5" /> Style & tips
            </div>
            <h2 className={cn(stb.heading, 'text-3xl md:text-4xl mb-2')}>
              From the ShopTheBarber blog
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Trends, techniques, and product picks from pros on the platform.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('InspirationFeed')}>
              <Button variant="ghost" className="gap-2">
                <Sparkles className="w-4 h-4" /> Inspiration
              </Button>
            </Link>
            <Link to={createPageUrl('Blog')}>
              <Button variant="ghost" className="gap-2 group">
                All articles <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={createPageUrl(`ArticleDetail?id=${article.id}`)}
                className="group block no-underline text-inherit"
              >
                <div className={cn(stb.surfaceHover, 'aspect-[16/10] overflow-hidden bg-muted mb-4 relative border border-foreground/10')}>
                  <OptimizedImage
                    src={
                      article.image_url ||
                      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80'
                    }
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {article.category && (
                    <span className="absolute top-3 left-3 text-xs font-semibold uppercase tracking-wider bg-background/90 backdrop-blur px-2.5 py-1 rounded-full text-foreground">
                      {article.category}
                    </span>
                  )}
                </div>
                <h3 className={cn(stb.uiHeading, 'text-lg group-hover:text-primary transition-colors line-clamp-2 mb-2')}>
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                )}
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
