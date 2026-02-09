import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

export default function ServiceCard({ service, variant = 'full', index = 0 }) {
  const isCompact = variant === 'compact';
  
  // Compact Variant (Dashboard)
  if (isCompact) {
    return (
        <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[1.5rem] border transition-all duration-300 cursor-pointer min-w-[100px] md:min-w-0 flex-1 h-full group ${service.bg || 'bg-white/5 border-white/5'} hover:bg-white/10 hover:border-white/20`}
        >
            <div className="p-3 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors duration-300">
                {service.icon && <service.icon className={`w-6 h-6 ${service.color || 'text-gray-400'} group-hover:text-primary transition-colors duration-300`} />}
            </div>
            <span className="text-xs font-medium tracking-wide text-gray-400 group-hover:text-white uppercase transition-colors">{service.name || service.label}</span>
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
                className="relative overflow-hidden bg-card rounded-3xl border border-border h-full group isolate"
            >
                {/* Background Image if available */}
                {service.image_url && (
                    <div className="absolute inset-0 z-0">
                        <OptimizedImage 
                            src={service.image_url} 
                            alt={service.label || service.name}
                            fill
                            className="opacity-40 group-hover:opacity-60 transition-opacity duration-500 group-hover:scale-105 transform"
                            imgClassName="transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/70 to-foreground/20"></div>
                    </div>
                )}

                <div className="relative z-10 p-6 flex flex-col h-full items-start min-h-[160px]">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.color ? service.color.replace('bg-', 'bg-opacity-20 bg-') : 'bg-white/10 text-white'} backdrop-blur-md mb-auto border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                        {service.icon && <service.icon className="w-6 h-6" />}
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-white text-xl mb-1">{service.label || service.name}</h3>
                        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Book Now <span className="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span></p>
                    </div>
                </div>
            </motion.div>
        </Link>
    </motion.div>
  );
}