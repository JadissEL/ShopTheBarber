import { sovereign } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star, MapPin, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function FeaturedBarbers() {
  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ['featured-barbers'],
    queryFn: () => sovereign.entities.Barber.list(),
    initialData: [],
  });

  const featured = barbers.slice(0, 3).map((b) => {
    const barberData = b.data || b;
    return {
      id: b.id,
      name: barberData.name || 'Professional Barber',
      title: barberData.title || 'Barber',
      image_url: barberData.image_url || 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&fit=crop',
      rating: barberData.rating || 0,
      review_count: barberData.review_count || 0,
      location: barberData.location || barberData.city || '-',
    };
  });

  return (
    <div className="py-24 bg-background relative stb-marketing-prose">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
                 <p className={cn(stb.label, 'mb-2')}>Talent Showcase</p>
                 <h2 className={cn(stb.heading, 'text-3xl mb-2')}>Featured Professionals</h2>
                 <p className="text-muted-foreground font-light text-lg">Curated experts who are redefining the craft.</p>
            </div>
            <Link to={createPageUrl('Explore')}>
                <Button variant="ghost" className="text-foreground hover:bg-muted gap-2 group">
                    View All Talent <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading professionals…</p>
        ) : featured.length === 0 ? (
          <EmptyState
            title="No professionals yet"
            description="Check back soon or explore the map to find barbers near you."
            actionLabel="Explore"
            actionHref={createPageUrl('Explore')}
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featured.map((barber, i) => (
                <motion.div 
                    key={barber.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group cursor-pointer"
                >
                    <Link to={createPageUrl(`BarberProfile?id=${barber.id}`)}>
                        <div className={cn(stb.surfaceHover, 'relative aspect-[3/4] overflow-hidden mb-6 group')}>
                            <OptimizedImage 
                                src={barber.image_url} 
                                alt={barber.name} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-foreground/50 opacity-60 group-hover:opacity-80 transition-opacity"></div>
                            
                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-foreground flex items-center gap-1 shadow-lg transform group-hover:scale-105 transition-transform">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {barber.rating > 0 ? barber.rating.toFixed(1) : 'New'}
                            </div>

                            <div className="absolute bottom-6 left-6 right-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                <div className="flex items-center gap-1 text-xs font-medium text-white/80 mb-1">
                                    <MapPin className="w-3 h-3" />
                                    {barber.location}
                                </div>
                                <h3 className={cn(stb.title, 'text-2xl mb-1 text-white')}>{barber.name}</h3>
                                <p className="text-white/80 text-sm font-light">{barber.title}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                               <TrendingUp className="w-4 h-4 text-primary" />
                               <span className="font-medium text-primary">High Demand</span>
                           </div>
                           <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                               Book Now &rarr;
                           </div>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </div>
        )}
      </div>
    </div>
  );
}
