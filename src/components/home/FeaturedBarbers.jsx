import { sovereign } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star, MapPin, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { motion } from 'framer-motion';

export default function FeaturedBarbers() {
  const { data: barbers } = useQuery({
    queryKey: ['featured-barbers'],
    queryFn: () => sovereign.entities.Barber.list(),
    initialData: [],
  });

  const mockImages = [
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&fit=crop",
      "https://images.unsplash.com/photo-1537832816519-689ad163238b?w=600&fit=crop",
      "https://images.unsplash.com/photo-1618077555391-58f6a9333c9c?w=600&fit=crop",
  ];
  
  const enhancedBarbers = (barbers.length > 0 ? barbers : [1,2,3]).slice(0, 3).map((b, idx) => {
      if (typeof b === 'object' && b.id) {
          const barberData = b.data || b;
          return {
              id: b.id,
              name: barberData.name || 'Professional Barber',
              title: barberData.title || 'Master Barber',
              image_url: barberData.image_url || mockImages[idx],
              rating: barberData.rating || 5.0,
              review_count: barberData.review_count || 0,
              location: barberData.location || 'City'
          };
      }
      return {
          id: b,
          name: ["James St. Patrick", "Sarah Jenkins", "Michael Chang"][idx],
          title: ["Master Barber", "Style Director", "Grooming Expert"][idx],
          image_url: mockImages[idx],
          rating: 5.0 - (idx * 0.02),
          review_count: 120 + (idx * 45),
          location: ["SoHo, NY", "Brooklyn, NY", "Tribeca, NY"][idx]
      };
  });

  return (
    <div className="py-24 bg-white relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
                 <div className="text-primary font-semibold uppercase tracking-wider text-xs mb-2">Talent Showcase</div>
                 <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Featured Professionals</h2>
                 <p className="text-slate-500 font-light text-lg">Curated experts who are redefining the craft.</p>
            </div>
            <Link to={createPageUrl('Explore')}>
                <Button variant="ghost" className="text-foreground hover:bg-muted gap-2 group">
                    View All Talent <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {enhancedBarbers.map((barber, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group cursor-pointer"
                >
                    <Link to={createPageUrl(`BarberProfile?id=${barber.id}`)}>
                        <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-slate-100 mb-6 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all duration-500">
                            <OptimizedImage 
                                src={barber.image_url} 
                                alt={barber.name} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                            
                            {/* Floating Rating */}
                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-foreground flex items-center gap-1 shadow-lg transform group-hover:scale-105 transition-transform">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {barber.rating > 0 ? barber.rating.toFixed(1) : 'New'}
                            </div>

                            {/* Bottom Info on Image */}
                            <div className="absolute bottom-6 left-6 right-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                <div className="flex items-center gap-1 text-xs font-medium text-white/80 mb-1">
                                    <MapPin className="w-3 h-3" />
                                    {barber.location}
                                </div>
                                <h3 className="text-2xl font-bold mb-1">{barber.name}</h3>
                                <p className="text-white/80 text-sm font-light">{barber.title}</p>
                            </div>
                        </div>
                        
                        {/* Meta Data */}
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-2 text-sm text-slate-500">
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
    </div>
    </div>
  );
}
