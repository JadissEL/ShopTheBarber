import { Quote, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';

const stories = [
  {
    title: "Wedding Emergency",
    quote: "Cancelled 2 hours before my wedding. ShopTheBarber found a pro in 30 mins.",
    name: "Marcus T.",
    role: "Groom",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    likes: "2.4k"
  },
  {
    title: "Interview Ready",
    quote: "Booked a 'Silent Cut' before my big interview. The confidence boost was insane.",
    name: "David Chen",
    role: "Software Engineer",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
    likes: "1.8k"
  },
  {
    title: "Kid's Magic",
    quote: "My son hated haircuts until we found a barber who did magic tricks!",
    name: "Sarah Jenkins",
    role: "Super Mom",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80",
    likes: "3.2k"
  }
];

export default function Testimonials() {
  return (
    <div className="py-32 relative bg-slate-50 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.08),_transparent_70%)] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
            <div className="max-w-2xl">
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-primary font-semibold tracking-wider uppercase text-sm mb-2 block"
                >
                    Community Stories
                </motion.span>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.1]"
                >
                  Moments That <br/>
                  <span className="text-primary">Saved the day.</span>
                </motion.h2>
            </div>
            <motion.p 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-lg text-slate-500 max-w-sm font-light leading-relaxed text-right md:text-left"
            >
                Real stories from real clients who found their perfect match when it mattered most.
            </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-10">
          {stories.map((story, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className={`group relative rounded-2xl overflow-hidden shadow-lg border border-border hover:shadow-xl hover:border-primary/20 transition-all duration-300 ${index === 1 ? 'md:-translate-y-16' : ''}`}
            >
              <div className="aspect-[3/4] relative bg-slate-200 overflow-hidden">
                  <OptimizedImage 
                    src={story.image} 
                    alt={story.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  {/* Floating Social Pill */}
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-full flex items-center gap-2 text-white text-xs font-bold shadow-lg transform group-hover:scale-105 transition-transform">
                      <Heart className="w-3.5 h-3.5 fill-white text-white" />
                      {story.likes}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white max-h-[70%] flex flex-col justify-end">
                     <div className="mb-2 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-lg group-hover:-translate-y-1 transition-transform duration-500">
                        <Quote className="w-4 h-4 fill-current" />
                     </div>
                     <p className="text-sm leading-snug mb-4 text-white/90 relative z-10 font-normal line-clamp-3">
                        "{story.quote}"
                     </p>
                     
                     <div className="flex items-center gap-2.5 pt-3 border-t border-white/10">
                        <div className="w-9 h-9 rounded-full bg-primary p-[2px] flex-shrink-0">
                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white relative">
                                <OptimizedImage src={story.image} fill className="object-cover" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{story.name}</div>
                            <div className="text-xs text-white/70 font-medium uppercase tracking-wider truncate">{story.role}</div>
                        </div>
                     </div>
                  </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}