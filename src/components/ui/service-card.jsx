import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';
import { catalogCardClasses, stb } from '@/lib/stbUi';

export default function ServiceCard({ service, variant = 'full', index = 0 }) {
  const isCompact = variant === 'compact';
  
  // Compact Variant (Dashboard)
  if (isCompact) {
    return (
        <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              stb.surfaceHover,
              'flex flex-col items-center justify-center gap-3 p-6 cursor-pointer min-w-[100px] md:min-w-0 flex-1 h-full group'
            )}
        >
            <div className="p-3 rounded-full bg-muted transition-colors duration-normal ease-out group-hover:bg-primary/20">
                {service.icon && <service.icon className={cn('w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors duration-normal ease-out', service.color)} />}
            </div>
            <span className="text-xs font-medium tracking-wide text-muted-foreground group-hover:text-foreground uppercase transition-colors duration-normal ease-out">{service.name || service.label}</span>
        </motion.div>
    );
  }

  // Full Variant (Services Page)
  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 }}
        className="h-full"
    >
        <Link 
            to={createPageUrl(`Explore?search=${service.label || service.name}`)}
            className="block h-full"
        >
            <motion.div 
                whileHover={{ y: -8 }}
                className={catalogCardClasses('relative h-full group isolate p-0')}
            >
                {service.image_url && (
                    <div className="absolute inset-0 z-0">
                        <OptimizedImage 
                            src={service.image_url} 
                            alt={service.label || service.name}
                            fill
                            className="opacity-40 group-hover:opacity-60 transition-opacity duration-normal ease-out group-hover:scale-105 transform"
                            imgClassName="transition-transform duration-normal ease-out"
                        />
                        <div className="absolute inset-0 bg-foreground/70" />
                    </div>
                )}

                <div className={cn(stb.catalogBody, 'relative z-10 flex flex-col h-full items-start min-h-[160px]')}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-card/20 text-foreground backdrop-blur-md mb-auto border border-foreground/10 group-hover:scale-110 transition-transform duration-normal ease-out">
                        {service.icon && <service.icon className="w-6 h-6" />}
                    </div>
                    
                    <div>
                        <h3 className={cn(stb.title, 'text-white text-xl mb-1')}>{service.label || service.name}</h3>
                        <p className={cn(stb.body, 'text-muted-foreground group-hover:text-foreground transition-colors duration-normal ease-out')}>
                          Book Now
                        </p>
                    </div>
                </div>
            </motion.div>
        </Link>
    </motion.div>
  );
}
