import { Link } from 'react-router-dom';
import { Quote, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { createPageUrl } from '@/utils';
import { useHomepage } from '@/hooks/useHomepage';
import { Button } from '@/components/ui/button';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop';

export default function Testimonials() {
  const { data, isLoading, isError } = useHomepage();
  const reviews = data?.featured_reviews ?? [];

  if (isLoading) {
    return (
      <div className="py-32 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6 animate-pulse">
          <div className="h-10 bg-muted rounded w-80 mb-12" />
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || reviews.length === 0) return null;

  return (
    <div className="stb-section relative bg-muted/20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="stb-section-label mb-2 block"
            >
              Verified reviews
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn(stb.heading, 'text-3xl md:text-4xl text-foreground')}
            >
              Real clients. Real results.
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-base text-muted-foreground max-w-sm leading-relaxed"
          >
            Reviews from completed bookings, not stock quotes or paid placements.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-10">
          {reviews.slice(0, 3).map((review, index) => {
            const image = review.author_avatar || FALLBACK_IMAGE;
            const profileLink = review.profile_path ? createPageUrl(review.profile_path) : null;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={cn(
                  'group relative overflow-hidden transition-all duration-200',
                  stb.cardInteractive,
                )}
              >
                <div className="aspect-[4/5] relative bg-muted overflow-hidden">
                  <OptimizedImage
                    src={image}
                    alt={review.author_name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-foreground/55" />

                  <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm px-2.5 py-1 rounded-md flex items-center gap-1.5 text-foreground text-xs font-semibold shadow-sm border border-foreground/10">
                    <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                    {review.rating?.toFixed(1) ?? '5.0'}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="mb-3 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/20 backdrop-blur-md border border-white/30">
                      <Quote className="w-4 h-4 fill-current" />
                    </div>
                    <p className="text-sm leading-relaxed mb-4 text-white/95 line-clamp-4">
                      &ldquo;{review.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-3 border-t border-white/15">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 relative shrink-0">
                        <OptimizedImage src={image} fill className="object-cover" alt="" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{review.author_name}</div>
                        <div className="text-xs text-white/70 truncate">
                          {profileLink ? (
                            <Link to={profileLink} className="hover:text-white underline-offset-2 hover:underline">
                              {review.target_name}
                            </Link>
                          ) : (
                            review.target_name
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-14">
          <Link to={createPageUrl('Explore')}>
            <Button variant="outline" size="lg" className=" px-8">
              Browse all barbers
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
