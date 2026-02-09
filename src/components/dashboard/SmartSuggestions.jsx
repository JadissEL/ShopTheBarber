import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ChevronRight } from 'lucide-react';

const suggestions = [
  {
    id: 1,
    title: 'Hot Towel Shave',
    subtitle: 'Based on your last visit',
    image_url: 'https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=400&auto=format&fit=crop',
    link: 'Explore?q=Hot+Towel+Shave',
  },
  {
    id: 2,
    title: 'Deep Cleanse',
    subtitle: 'Recommend',
    image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&auto=format&fit=crop',
    link: 'Explore?q=Deep+Cleanse',
  },
  {
    id: 3,
    title: 'Beard Sculpt',
    subtitle: 'Popular this week',
    image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&auto=format&fit=crop',
    link: 'Explore?q=Beard+Sculpt',
  },
];

export default function SmartSuggestions() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Smart Suggestions</h2>
        <Link to={createPageUrl('Explore')} className="text-sm font-semibold text-primary hover:underline flex items-center gap-0.5">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 scrollbar-hide">
        {suggestions.map((item) => (
          <Link key={item.id} to={createPageUrl(item.link)} className="shrink-0 w-[180px]">
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all h-full"
            >
              <div className="relative aspect-[4/5] bg-primary/90">
                <OptimizedImage
                  src={item.image_url}
                  alt={item.title}
                  fill
                  imgClassName="object-cover opacity-80"
                  width={360}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-bold text-sm mb-0.5">{item.title}</h3>
                  <p className="text-xs text-white/80">{item.subtitle}</p>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
